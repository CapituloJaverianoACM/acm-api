import { IDatabase } from "../db/database.interface";
import { MongoAdapter } from "../db/mongo/mongo.adapter";

const COLLECTION = "match_sessions";
const db: IDatabase = new MongoAdapter();
const SESSION_CACHE_SIZE = 50;

// Types for MongoDB storage
export type StoredUserState = {
    userId: number;
    handle: string | null;
    isReady: boolean;
    solvedProblems: string[];
};

export type StoredMatchSession = {
    pairKey: string;
    contestID: number;
    currentProblem: {
        contestId: number;
        index: string;
        name: string;
        rating: number;
    } | null;
    isActive: boolean;
    isFinished: boolean;
    users: StoredUserState[];
    updatedAt: Date;
};

// In-memory cache with LRU eviction
export var sessionCache: Map<string, StoredMatchSession> = new Map();

// Helper functions for serialization/deserialization
function serializeUserState(users: Map<number, any>): StoredUserState[] {
    return Array.from(users.entries()).map(([userId, user]) => ({
        userId,
        handle: user.handle,
        isReady: user.isReady,
        solvedProblems: Array.from(user.solvedProblems),
    }));
}

function deserializeUserState(users: StoredUserState[]): Map<number, any> {
    const userMap = new Map<number, any>();
    users.forEach((user) => {
        userMap.set(user.userId, {
            ws: null, // WebSocket connections are not persisted
            handle: user.handle,
            isReady: user.isReady,
            solvedProblems: new Set(user.solvedProblems),
        });
    });
    return userMap;
}

export async function getSessionByPairKey(pairKey: string) {
    // Check cache first
    if (sessionCache.has(pairKey)) {
        const session = sessionCache.get(pairKey)!;
        // Move to end (most recently used)
        sessionCache.delete(pairKey);
        sessionCache.set(pairKey, session);
        return session;
    }

    // Load from database
    const result = await db.getBy<StoredMatchSession>(COLLECTION, { pairKey });
    if (!result.error && result.data) {
        const session = result.data as StoredMatchSession;
        sessionCache.set(pairKey, session);

        // Limit cache size
        if (sessionCache.size > SESSION_CACHE_SIZE) {
            const firstKey = sessionCache.keys().next().value;
            if (firstKey !== undefined) sessionCache.delete(firstKey);
        }

        return session;
    }

    return null;
}

export async function createSession(
    pairKey: string,
    contestId: number,
): Promise<{ error: string | null; data: StoredMatchSession | null }> {
    const newSession: StoredMatchSession = {
        pairKey,
        contestID: contestId,
        currentProblem: null,
        isActive: false,
        isFinished: false,
        users: [],
        updatedAt: new Date(),
    };

    const result = await db.insert<StoredMatchSession>(COLLECTION, newSession);
    if (!result.error) {
        sessionCache.set(pairKey, newSession);
        return { error: null, data: newSession };
    }

    return result;
}

export async function updateSession(
    pairKey: string,
    updates: Partial<StoredMatchSession>,
): Promise<{ error: string | null; data: any }> {
    // Update cache if exists
    if (sessionCache.has(pairKey)) {
        const cached = sessionCache.get(pairKey)!;
        sessionCache.delete(pairKey);
        sessionCache.set(pairKey, { ...cached, ...updates, updatedAt: new Date() });
    }

    // Update database
    const result = await db.update<StoredMatchSession>(COLLECTION, { pairKey }, {
        ...updates,
        updatedAt: new Date(),
        pairKey,
    } as StoredMatchSession);

    return result;
}

export function deleteSession(pairKey: string): {
    error: string | null;
    data: any;
} {
    // Remove from cache
    if (sessionCache.has(pairKey)) {
        sessionCache.delete(pairKey);
    }

    // Remove from database
    return { error: null, data: null };
}

export async function addUserToSession(
    pairKey: string,
    userId: number,
    handle: string | null = null,
    isReady: boolean = false,
    solvedProblems: string[] = [],
): Promise<{ error: string | null; data: any }> {
    const session = await getSessionByPairKey(pairKey);
    if (!session) {
        return { error: "Session not found", data: null };
    }

    // Check if user already exists
    const existingUserIndex = session.users.findIndex((u) => u.userId === userId);
    if (existingUserIndex !== -1) {
        // Update existing user
        session.users[existingUserIndex] = {
            userId,
            handle: handle || session.users[existingUserIndex].handle,
            isReady,
            solvedProblems,
        };
    } else {
        // Add new user
        session.users.push({
            userId,
            handle,
            isReady,
            solvedProblems,
        });
    }

    return await updateSession(pairKey, { users: session.users });
}

export async function removeUserFromSession(
    pairKey: string,
    userId: number,
): Promise<{ error: string | null; data: any }> {
    const session = await getSessionByPairKey(pairKey);
    if (!session) {
        return { error: "Session not found", data: null };
    }

    session.users = session.users.filter((u) => u.userId !== userId);

    // If no users left, delete the session
    if (session.users.length === 0) {
        return await deleteSession(pairKey);
    }

    return await updateSession(pairKey, { users: session.users });
}

export async function updateUserReadyStatus(
    pairKey: string,
    userId: number,
    isReady: boolean,
): Promise<{ error: string | null; data: any }> {
    const session = await getSessionByPairKey(pairKey);
    if (!session) {
        return { error: "Session not found", data: null };
    }

    const userIndex = session.users.findIndex((u) => u.userId === userId);
    if (userIndex === -1) {
        return { error: "User not found in session", data: null };
    }

    session.users[userIndex].isReady = isReady;
    return await updateSession(pairKey, { users: session.users });
}

export async function updateUserSolvedProblems(
    pairKey: string,
    userId: number,
    solvedProblems: string[],
    handle: string,
): Promise<{ error: string | null; data: any }> {
    const session = await getSessionByPairKey(pairKey);
    if (!session) {
        return { error: "Session not found", data: null };
    }

    const userIndex = session.users.findIndex((u) => u.userId === userId);
    if (userIndex === -1) {
        return { error: "User not found in session", data: null };
    }

    session.users[userIndex].solvedProblems = solvedProblems;
    session.users[userIndex].handle = handle;
    return await updateSession(pairKey, { users: session.users });
}
