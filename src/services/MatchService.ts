// Tipos simples
type CFProblem = {
    contestId: number;
    index: string;
    name: string;
    rating: number;
};
type UserState = {
    ws: any;
    handle: string | null;
    isReady: boolean;
    solvedProblems: Set<string>;
};

import { SupabaseAdapter } from "../db/supabase/supabase.adapter";
// Import session manager
import {
    getSessionByPairKey,
    createSession,
    updateSession,
    deleteSession,
    addUserToSession,
    updateUserReadyStatus,
    updateUserSolvedProblems,
} from "../utils/session-manager";
import { WebSocketError, getErrorMessage } from "../utils/websocket-errors";
import { WebSocketMessenger } from "../utils/websocket-messenger";
import { ResultService } from "./ResultService";

const result_service = new ResultService(new SupabaseAdapter());

export class MatchService {
    // In-memory cache for WebSocket connections (not persisted)
    private activeConnections = new Map<string, Map<number, any>>();
    private allProblemsCache: CFProblem[] = [];
    private problemsLoaded = false;
    private lastCFRequest = 0; // Timestamp del último request a Codeforces
    private messenger: WebSocketMessenger;

    constructor() {
        this.messenger = new WebSocketMessenger(this.activeConnections);
        // Cargar problemas al iniciar
        this.loadProblems();
    }

    // Helper to send error messages through WebSocket
    private sendError(
        pairKey: string,
        userId: number,
        error: WebSocketError,
        context?: string,
    ) {
        this.messenger.sendError(
            pairKey,
            userId,
            error,
            getErrorMessage(error),
            context,
        );
        console.error(
            `[${pairKey}] Error for user ${userId}: ${error} - ${getErrorMessage(
                error,
            )}${context ? ` (${context})` : ""}`,
        );
    }

    // Helper to convert stored session to in-memory format with WebSockets
    private async getSessionWithConnections(pairKey: string): Promise<{
        users: Map<number, UserState>;
        contestId: number;
        currentProblem: CFProblem | null;
        isActive: boolean;
        isFinished: boolean;
    } | null> {
        const storedSession = await getSessionByPairKey(pairKey);
        if (!storedSession) return null;

        const users = new Map<number, UserState>();
        storedSession.users.forEach((storedUser) => {
            const ws = this.activeConnections.get(pairKey)?.get(storedUser.userId);
            users.set(storedUser.userId, {
                ws: ws || null,
                handle: storedUser.handle,
                isReady: storedUser.isReady,
                solvedProblems: new Set(storedUser.solvedProblems),
            });
        });

        return {
            users,
            contestId: storedSession.contestId,
            currentProblem: storedSession.currentProblem,
            isActive: storedSession.isActive,
            isFinished: storedSession.isFinished,
        };
    }

    // Helper to manage active connections
    private addConnection(pairKey: string, userId: number, ws: any) {
        if (!this.activeConnections.has(pairKey)) {
            this.activeConnections.set(pairKey, new Map());
        }
        this.activeConnections.get(pairKey)!.set(userId, ws);
    }

    private removeConnection(pairKey: string, userId: number) {
        const connections = this.activeConnections.get(pairKey);
        if (connections) {
            connections.delete(userId);
            if (connections.size === 0) {
                this.activeConnections.delete(pairKey);
            }
        }
    }

    private getConnection(pairKey: string, userId: number): any | null {
        return this.activeConnections.get(pairKey)?.get(userId) || null;
    }

    // Cargar problemas con espera
    private async loadProblems() {
        try {
            console.log("Loading problems from Codeforces...");
            const res = await fetch("https://codeforces.com/api/problemset.problems");
            const data = await res.json();
            if (data.status === "OK") {
                // Filtrar solo problemas de rating 800
                this.allProblemsCache = data.result.problems
                    .filter((p: any) => p.rating === 800)
                    .map((p: any) => ({
                        contestId: p.contestId,
                        index: p.index,
                        name: p.name,
                        rating: p.rating,
                    }));
                this.problemsLoaded = true;
                console.log(
                    `Loaded ${this.allProblemsCache.length} problems with rating 800`,
                );
            }
        } catch (e) {
            console.error("Error loading problems from Codeforces", e);
        }
    }

    // Rate limiter para Codeforces (1 request cada 2 segundos)
    private async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastCFRequest;
        if (timeSinceLastRequest < 2000) {
            await new Promise((resolve) =>
                setTimeout(resolve, 2000 - timeSinceLastRequest),
            );
        }
        this.lastCFRequest = Date.now();
    }

    // 1. Gestión de Conexiones
    async connect(pairKey: string, contestId: number, userId: number, ws: any) {
        // Add WebSocket connection to memory cache
        this.addConnection(pairKey, userId, ws);

        let session = await getSessionByPairKey(pairKey);

        if (session) {
            if (session.isFinished) {
                this.sendError(
                    pairKey,
                    userId,
                    WebSocketError.MATCH_ALREADY_FINISHED,
                    "connect",
                );
                ws.close();
                return;
            }

            const thisUserExists = session.users.find(user => user.userId === userId);
            
            if (thisUserExists) {
                this.messenger.sendSessionResume(pairKey, userId, session);
                console.log(
                `User ${userId} reconnected to room ${pairKey} (Match state: active=${session.isActive}, finished=${session.isFinished})`,
            );
                return; 
            }

        }

        if (!session) {
            // Create new session if it doesn't exist
            const result = await createSession(pairKey, contestId);
            if (result.error) {
                this.sendError(
                    pairKey,
                    userId,
                    WebSocketError.SESSION_CREATION_FAILED,
                    "connect",
                );
                return;
            }
            session = result.data!;
        }

        // Check if user already exists in session
        const existingUser = session.users.find((u) => u.userId === userId);
        if (!existingUser) {
            // Add new user to session
            const result = await addUserToSession(
                pairKey,
                userId,
                ws.message?.data?.handle,
            );
            if (result.error) {
                this.sendError(
                    pairKey,
                    userId,
                    WebSocketError.USER_ADD_FAILED,
                    "connect",
                );
                return;
            }
            console.log(`User ${userId} connected to room ${pairKey}`);
        }
    }

    async disconnect(pairKey: string, userId: number) {
        // Remove WebSocket connection from memory
        this.removeConnection(pairKey, userId);
    }

    // 2. Manejo de READY (Idempotente)
    async setReady(pairKey: string, userId: number, handle: string) {
        const session = await getSessionByPairKey(pairKey);
        if (!session) {
            this.sendError(
                pairKey,
                userId,
                WebSocketError.SESSION_NOT_FOUND,
                "setReady",
            );
            return;
        }

        const user = session.users.find((u) => u.userId === userId);
        if (!user) {
            this.sendError(
                pairKey,
                userId,
                WebSocketError.USER_NOT_FOUND,
                "setReady",
            );
            return;
        }

        // No permitir READY si el match ya está activo o terminado
        if (session.isActive) {
            this.sendError(
                pairKey,
                userId,
                WebSocketError.MATCH_ALREADY_ACTIVE,
                "setReady",
            );
            return;
        }

        if (session.isFinished) {
            this.sendError(
                pairKey,
                userId,
                WebSocketError.MATCH_ALREADY_FINISHED,
                "setReady",
            );
            return;
        }

        // Guardar handle y cargar problemas resueltos si cambió el handle
        let solvedProblems = user.solvedProblems;
        if (user.handle !== handle) {
            solvedProblems = Array.from(await this.fetchUserSolved(handle));
            console.log(
                `User ${userId} (${handle}) problems loaded: ${solvedProblems.length}`,
            );
        }

        // Update user in database
        const result = await updateUserSolvedProblems(
            pairKey,
            userId,
            solvedProblems,
            handle,
        );
        if (result.error) {
            this.sendError(
                pairKey,
                userId,
                WebSocketError.SOLVED_PROBLEMS_UPDATE_FAILED,
                "setReady",
            );
            return;
        }

        const readyResult = await updateUserReadyStatus(pairKey, userId, true);
        if (readyResult.error) {
            this.sendError(
                pairKey,
                userId,
                WebSocketError.READY_STATUS_UPDATE_FAILED,
                "setReady",
            );
            return;
        }

        console.log(`User ${userId} (${handle}) is READY`);

        // Intentar iniciar la partida
        this.tryStartMatch(pairKey);
    }

    async setNotReady(pairKey: string, userId: number) {
        const session = await getSessionByPairKey(pairKey);
        if (!session) {
            this.sendError(
                pairKey,
                userId,
                WebSocketError.SESSION_NOT_FOUND,
                "setNotReady",
            );
            return;
        }

        // No permitir NOT_READY si el match está activo o terminado
        if (session.isActive) {
            this.sendError(
                pairKey,
                userId,
                WebSocketError.MATCH_ALREADY_ACTIVE,
                "setNotReady",
            );
            return;
        }

        if (session.isFinished) {
            this.sendError(
                pairKey,
                userId,
                WebSocketError.MATCH_ALREADY_FINISHED,
                "setNotReady",
            );
            return;
        }

        const user = session.users.find((u) => u.userId === userId);
        if (user) {
            const result = await updateUserReadyStatus(pairKey, userId, false);
            if (result.error) {
                this.sendError(
                    pairKey,
                    userId,
                    WebSocketError.READY_STATUS_UPDATE_FAILED,
                    "setNotReady",
                );
                return;
            }
            console.log(`[${pairKey}] User ${userId} is NOT READY`);
        } else {
            this.sendError(
                pairKey,
                userId,
                WebSocketError.USER_NOT_FOUND,
                "setNotReady",
            );
        }
    }

    // 3. Iniciar Partida
    private async tryStartMatch(pairKey: string) {
        const session = await getSessionByPairKey(pairKey);
        if (!session) {
            // Send error to all connected users
            const connections = this.activeConnections.get(pairKey);
            if (connections) {
                for (const [userId] of connections) {
                    this.sendError(
                        pairKey,
                        userId,
                        WebSocketError.SESSION_NOT_FOUND,
                        "tryStartMatch",
                    );
                }
            }
            return;
        }

        // Necesitamos exactamente 2 usuarios listos
        if (session.users.length !== 2) {
            console.log(
                `[${pairKey}] Waiting for 2 users. Current: ${session.users.length}`,
            );
            return;
        }

        const allReady = session.users.every((u) => u.isReady);

        if (!allReady) {
            console.log(
                `[${pairKey}] Not all users ready. Ready count: ${session.users.filter((u) => u.isReady).length}/2`,
            );
            return;
        }

        if (!this.problemsLoaded) {
            // Send error to all connected users
            session.users.forEach((user) => {
                this.sendError(
                    pairKey,
                    user.userId,
                    WebSocketError.PROBLEMS_NOT_LOADED,
                    "tryStartMatch",
                );
            });
            return;
        }

        // Convert to UserState format for problem finding
        const userA: UserState = {
            ws: this.getConnection(pairKey, session.users[0].userId),
            handle: session.users[0].handle,
            isReady: session.users[0].isReady,
            solvedProblems: new Set(session.users[0].solvedProblems),
        };

        const userB: UserState = {
            ws: this.getConnection(pairKey, session.users[1].userId),
            handle: session.users[1].handle,
            isReady: session.users[1].isReady,
            solvedProblems: new Set(session.users[1].solvedProblems),
        };

        // Buscar problema
        const problem = this.findFairProblem(userA, userB);

        if (!problem) {
            // Send error to all connected users
            session.users.forEach((user) => {
                this.sendError(
                    pairKey,
                    user.userId,
                    WebSocketError.NO_FAIR_PROBLEM_FOUND,
                    "tryStartMatch",
                );
            });
            return;
        }

        // Iniciar partida
        const result = await updateSession(pairKey, {
            currentProblem: problem,
            isActive: true,
        });

        if (result.error) {
            // Send error to all connected users
            session.users.forEach((user) => {
                this.sendError(
                    pairKey,
                    user.userId,
                    WebSocketError.MATCH_START_FAILED,
                    "tryStartMatch",
                );
            });
            return;
        }

        // Send to both users using messenger
        this.messenger.sendMatchStart(pairKey, {
            pairKey,
            problem: {
                contestId: problem.contestId,
                index: problem.index,
                name: problem.name,
                rating: problem.rating,
                url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`
            }
        });

        console.log(`[${pairKey}] Match started: ${problem.name}`);
    }

    // 4. Verificar Victoria (CHECK)
    async checkWinCondition(pairKey: string, userId: number) {
        const session = await getSessionByPairKey(pairKey);
        if (!session) {
            this.sendError(
                pairKey,
                userId,
                WebSocketError.SESSION_NOT_FOUND,
                "checkWinCondition",
            );
            return;
        }

        if (!session.isActive) {
            this.sendError(
                pairKey,
                userId,
                WebSocketError.MATCH_NOT_ACTIVE,
                "checkWinCondition",
            );
            return;
        }

        if (!session.currentProblem) {
            this.sendError(
                pairKey,
                userId,
                WebSocketError.MATCH_NOT_ACTIVE,
                "checkWinCondition - no current problem",
            );
            return;
        }

        // No permitir CHECK si el match ya terminó
        if (session.isFinished) {
            this.sendError(
                pairKey,
                userId,
                WebSocketError.MATCH_ALREADY_FINISHED,
                "checkWinCondition",
            );
            return;
        }

        const user = session.users.find((u) => u.userId === userId);
        if (!user || !user.handle) {
            this.sendError(
                pairKey,
                userId,
                WebSocketError.USER_NOT_FOUND,
                "checkWinCondition",
            );
            return;
        }

        // Verificar en Codeforces si resolvió el problema actual
        const isSolved = await this.verifySpecificProblem(
            user.handle,
            session.currentProblem,
        );

        if (isSolved) {
            // add result
            let looser_id: number = session.users
                .filter((us) => us.userId !== userId)
                .map((us) => us.userId)[0];

            const res = await result_service.create({
                contest_id: session.contestId,
                winner_id: userId,
                local_id: userId,
                visitant_id: looser_id,
            });

            if (res.error) {
                this.sendError(
                    pairKey,
                    userId,
                    WebSocketError.INTERNAL_ERROR,
                    "We could not store the result.",
                );
                return;
            }

            // Usuario ganó - use messenger
            this.messenger.sendWinner(pairKey, userId, {
                pairKey,
                userId
            });
            console.log(`[${pairKey}] User ${userId} WINNER`);

            this.messenger.sendLoser(pairKey, looser_id, {
                pairKey,
                userId: looser_id,
                opponent: {
                    userId: userId,
                    handle: user.handle
                }
            });
            console.log(`[${pairKey}] User ${looser_id} LOSER`);

            // Terminar partida
            const result = await updateSession(pairKey, {
                isActive: false,
                isFinished: true,
                currentProblem: null,
            });

            if (result.error) {
                // Send error to all users
                session.users.forEach((user) => {
                    this.sendError(
                        pairKey,
                        user.userId,
                        WebSocketError.MATCH_FINISH_FAILED,
                        "checkWinCondition",
                    );
                });
                return;
            }

            // Reset all users ready status
            for (const user of session.users) {
                await updateUserReadyStatus(pairKey, user.userId, false);
            }

            // Close connection.
            for (const user of session.users) {
                const ws = this.getConnection(pairKey, user.userId);
                if (ws) {
                    ws.close();
                }
            }

            // Remove session from cache
            deleteSession(pairKey);
        } else {
            // Continuar - use messenger
            this.messenger.sendContinue(pairKey, userId);
        }
    }

    // --- Helpers de Codeforces ---

    private findFairProblem(
        userA: UserState,
        userB: UserState,
    ): CFProblem | null {
        const candidates = this.allProblemsCache.filter(
            (p) =>
                !userA.solvedProblems.has(`${p.contestId}-${p.index}`) &&
                !userB.solvedProblems.has(`${p.contestId}-${p.index}`),
        );

        if (candidates.length === 0) return null;
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    private async fetchUserSolved(handle: string): Promise<Set<string>> {
        const solved = new Set<string>();
        try {
            await this.waitForRateLimit();
            const res = await fetch(
                `https://codeforces.com/api/user.status?handle=${handle}`,
            );
            const data = await res.json();

            if (data.status === "OK" && data.result) {
                data.result.forEach((sub: any) => {
                    if (sub.verdict === "OK") {
                        solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
                    }
                });
            } else {
                console.warn(`Failed to fetch user ${handle}:`, data.comment);
            }
        } catch (e) {
            console.error(`Error fetching user ${handle}:`, e);
        }
        return solved;
    }

    private async verifySpecificProblem(
        handle: string,
        problem: CFProblem,
    ): Promise<boolean> {
        try {
            await this.waitForRateLimit();
            const res = await fetch(
                `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=5`,
            );
            const data = await res.json();

            if (data.status === "OK" && data.result) {
                return data.result.some(
                    (sub: any) =>
                        sub.verdict === "OK" &&
                        sub.problem.contestId === problem.contestId &&
                        sub.problem.index === problem.index,
                );
            }
        } catch (e) {
            console.error(`Error verifying problem for ${handle}:`, e);
        }
        return false;
    }
}
