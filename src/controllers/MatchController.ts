import { Elysia, t } from 'elysia'
import { SocketParams } from '../utils/schemas/websocket';
import { StudentService } from '../services/StudentService';
import { SupabaseAdapter } from '../db/supabase/supabase.adapter';

const matchPairs = new Map<string, Set<string>>();
const readyStates = new Map<string, { menor: boolean, mayor: boolean }>();
const usedProblems = new Set<string>();
const studentService = new StudentService(new SupabaseAdapter());

// Cache for all CF problems
let allCFProblems: Array<{ contestId: number; index: string; name: string; rating: number | null }> = [];
let allCFProblemsTimestamp = 0;

async function fetchAllCFProblems(): Promise<Array<{ contestId: number; index: string; name: string; rating: number | null }>> {
    const now = Date.now();
    if (allCFProblems.length > 0 && (now - allCFProblemsTimestamp) < 60 * 60 * 1000) {
        return allCFProblems;
    }

    const resp = await fetch('https://codeforces.com/api/problemset.problems');
    const data = await resp.json();
    if (!data || data.status !== 'OK' || !Array.isArray(data.result?.problems)) {
        return [];
    }

    allCFProblems = data.result.problems.map((p: any) => ({
        contestId: p.contestId,
        index: p.index,
        name: p.name,
        rating: p.rating ?? null,
    }));
    allCFProblemsTimestamp = now;
    return allCFProblems;
}

async function fetchUserSolvedProblems(handle: string | null): Promise<Array<{ contestId: number; index: string; name: string; rating: number }>> {
    if (!handle) return [];
    const resp = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`);
    const data = await resp.json();
    if (!data || data.status !== 'OK' || !Array.isArray(data.result)) return [];
    const unique = new Map<string, { contestId: number; index: string; name: string; rating: number }>();
    for (const submission of data.result) {
        if (submission && submission.verdict === 'OK' && submission.problem) {
            const { contestId, index, name, rating } = submission.problem;
            if (rating === undefined || rating < 800 || rating > 1000) continue;
            const key = `${contestId}-${index}`;
            if (!unique.has(key)) unique.set(key, { contestId, index, name, rating });
        }
    }
    return Array.from(unique.values());
}

// Codeforces rate-limiter and cache to respect 1 req/2sec and reduce calls
const CF_RATE_LIMIT_MS = 2000;
let cfLastRequest = 0;
const cfCache = new Map<string, { timestamp: number; problems: Array<{ contestId: number; index: string; name: string; rating: number }> }>();
const cfPending = new Map<string, Promise<Array<{ contestId: number; index: string; name: string; rating: number }>>>();

async function getSolvedProblemsRateLimited(handle: string | null): Promise<Array<{ contestId: number; index: string; name: string; rating: number }>> {
    if (!handle) return [];

    // If already cached, return immediately
    const cached = cfCache.get(handle);
    if (cached && (Date.now() - cached.timestamp) < 5 * 60 * 1000) {
        return cached.problems;
    }

    // If a request is already pending for this handle, wait for it instead of making a duplicate
    if (cfPending.has(handle)) {
        return cfPending.get(handle)!;
    }

    // Create and track the promise
    const promise = (async () => {
        const now = Date.now();
        const waitMs = CF_RATE_LIMIT_MS - (now - cfLastRequest);
        if (waitMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
        cfLastRequest = Date.now();

        const problems = await fetchUserSolvedProblems(handle);
        cfCache.set(handle, { timestamp: Date.now(), problems });
        return problems;
    })();

    cfPending.set(handle, promise);
    const result = await promise;
    cfPending.delete(handle);
    return result;
}

async function selectNextProblem(
    ownProblems: Array<{ contestId: number; index: string; name: string; rating: number }>,
    opponentProblems: Array<{ contestId: number; index: string; name: string; rating: number }>
): Promise<{ contestId: number; index: string; name: string; rating: number } | null> {
    const allProblems = await fetchAllCFProblems();

    const solvedSet = new Set<string>();
    for (const p of ownProblems) solvedSet.add(`${p.contestId}-${p.index}`);
    for (const p of opponentProblems) solvedSet.add(`${p.contestId}-${p.index}`);

    const candidates = allProblems
        .filter(p => {
            if (p.rating === null || p.rating < 800 || p.rating > 1000) return false;
            const key = `${p.contestId}-${p.index}`;
            return !solvedSet.has(key) && !usedProblems.has(key);
        })
        .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));

    if (candidates.length === 0) return null;

    const selected = candidates[0] as { contestId: number; index: string; name: string; rating: number };
    const key = `${selected.contestId}-${selected.index}`;
    usedProblems.add(key);

    return selected;
}
export const match = new Elysia()
    .derive(async ({ params }) => {
        const { ownID, opponentID } = params;
        const sortedIds = [Number(ownID), Number(opponentID)].sort((a, b) => a - b);
        const pairKey = `${sortedIds[0]}-${sortedIds[1]}`;
        const connId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const fetchHandle = async (id: number) => {
            const result = await studentService.getOne(id);
            if (result.error) return null;
            const record = Array.isArray(result.data) ? result.data[0] : result.data;
            return record?.codeforces_handle ?? null;
        };

        const handles = {
            own: await fetchHandle(Number(ownID)),
            opponent: await fetchHandle(Number(opponentID)),
        };

        const problems = {
            own: await getSolvedProblemsRateLimited(handles.own),
            opponent: await getSolvedProblemsRateLimited(handles.opponent),
        };

        console.log('derive handles', handles);
        console.log('derive problems counts', { own: problems.own.length, opponent: problems.opponent.length });

        return {
            pairKey,
            connId,
            handles,
            problems,
        };
    })
    .ws('/ws/contest/:ownID/:opponentID', {
        params: SocketParams,

        async open(ws) {
            const { pairKey, connId } = ws.data;

            if (!matchPairs.has(pairKey)) {
                matchPairs.set(pairKey, new Set());
            }
            matchPairs.get(pairKey)!.add(connId);

            if (!readyStates.has(pairKey)) {
                readyStates.set(pairKey, { menor: false, mayor: false });
            }
            console.log('open pair', { pairKey, connId });
            console.log('open handles', (ws.data as any).handles);
            console.log('open problems counts', {
                own: (ws.data as any).problems?.own?.length ?? 0,
                opponent: (ws.data as any).problems?.opponent?.length ?? 0,
            });

            ws.subscribe(pairKey);
        },

        message(ws, message: any) {
            const { pairKey, connId } = ws.data;
            const { ownID, opponentID } = ws.data.params;

            if (message.action === 'PING') {
                ws.send({
                    action: 'PONG',
                    data: { pairKey, from: 'server' }
                });
                return;
            }

            if (message.action === 'READY') {
                const state = readyStates.get(pairKey)!;
                if (Number(ownID) < Number(opponentID)) state.menor = true;
                else state.mayor = true;
                if (state.menor && state.mayor) {
                    (async () => {
                        const problems = (ws.data as any).problems;
                        const selected = await selectNextProblem(problems.own, problems.opponent);
                        const startMsg = {
                            action: 'START_CONTEST',
                            pairKey,
                            problem: selected ? {
                                contestId: selected.contestId,
                                index: selected.index,
                                name: selected.name,
                                rating: selected.rating,
                            } : null,
                        };
                        ws.publish(pairKey, startMsg);
                        ws.send(startMsg);
                    })();
                }
            }

            if (message.action === 'NOT_READY') {
                const state = readyStates.get(pairKey)!;
                if (Number(ownID) < Number(opponentID)) state.menor = false;
                else state.mayor = false;
            }
        },

        close(ws) {
            const { pairKey, connId } = ws.data;

            const pairSet = matchPairs.get(pairKey);
            if (pairSet) {
                pairSet.delete(connId);
                if (pairSet.size === 0) {
                    matchPairs.delete(pairKey);
                }
            }

            if (readyStates.has(pairKey)) {
                readyStates.delete(pairKey);
            }

            ws.unsubscribe(pairKey);
        }
    });