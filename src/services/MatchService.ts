// Tipos simples
type CFProblem = { contestId: number; index: string; name: string; rating: number };
type UserState = {
    ws: any;
    handle: string | null;
    isReady: boolean;
    solvedProblems: Set<string>;
};

type MatchSession = {
    users: Map<number, UserState>;
    contestID: number;
    currentProblem: CFProblem | null;
    isActive: boolean;
    isFinished: boolean; // El match terminó (hay ganador/perdedor)
};

export class MatchService {
    // Pair-key -> MatchSession
    private sessions = new Map<string, MatchSession>();
    private allProblemsCache: CFProblem[] = [];
    private problemsLoaded = false;
    private lastCFRequest = 0; // Timestamp del último request a Codeforces

    constructor() {
        // Cargar problemas al iniciar
        this.loadProblems();
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
                        rating: p.rating
                    }));
                this.problemsLoaded = true;
                console.log(`Loaded ${this.allProblemsCache.length} problems with rating 800`);
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
            await new Promise(resolve => setTimeout(resolve, 2000 - timeSinceLastRequest));
        }
        this.lastCFRequest = Date.now();
    }

    // 1. Gestión de Conexiones
    connect(pairKey: string, contestId: number, userId: number, ws: any) {
        if (!this.sessions.has(pairKey)) {
            this.sessions.set(pairKey, { 
                users: new Map(),
                contestID: contestId, 
                currentProblem: null, 
                isActive: false,
                isFinished: false
            });
        }
        const session = this.sessions.get(pairKey)!;
        
        // Si el usuario ya existe en sesión, solo actualizamos el socket (reconexión)
        if (session.users.has(userId)) {
            const user = session.users.get(userId)!;
            user.ws = ws; // Actualizar socket
            console.log(`User ${userId} reconnected to room ${pairKey} (Match state: active=${session.isActive}, finished=${session.isFinished})`);
        } else {
            // Crear nuevo usuario
            session.users.set(userId, {
                ws,
                handle: null,
                isReady: false,
                solvedProblems: new Set()
            });
            console.log(`User ${userId} connected to room ${pairKey}`);
        }
    }

    disconnect(pairKey: string, userId: number) {
        const session = this.sessions.get(pairKey);
        if (session) {
            session.users.delete(userId);
            // Si la sala se vacía, la borramos para liberar memoria
            if (session.users.size === 0) {
                this.sessions.delete(pairKey);
            }
        }
    }

    // 2. Manejo de READY (Idempotente)
    async setReady(pairKey: string, userId: number, handle: string) {
        const session = this.sessions.get(pairKey);
        if (!session) return;

        const user = session.users.get(userId);
        if (!user) return;

        // No permitir READY si el match ya está activo o terminado
        if (session.isActive) {
            console.log(`[${pairKey}] User ${userId} tried READY but match is already active. Ignoring.`);
            return;
        }

        if (session.isFinished) {
            console.log(`[${pairKey}] User ${userId} tried READY but match is finished. Ignoring.`);
            return;
        }

        // Guardar handle y cargar problemas resueltos si cambió el handle
        if (user.handle !== handle) {
            user.handle = handle;
            user.solvedProblems = await this.fetchUserSolved(handle);
            console.log(`User ${userId} (${handle}) problems loaded: ${user.solvedProblems.size}`);
        }

        user.isReady = true;
        console.log(`User ${userId} (${handle}) is READY`);

        // Intentar iniciar la partida
        this.tryStartMatch(pairKey, session);
    }

    setNotReady(pairKey: string, userId: number) {
        const session = this.sessions.get(pairKey);
        if (!session) return;

        // No permitir NOT_READY si el match está activo o terminado
        if (session.isActive) {
            console.log(`[${pairKey}] User ${userId} tried NOT_READY but match is active. Ignoring.`);
            return;
        }

        if (session.isFinished) {
            console.log(`[${pairKey}] User ${userId} tried NOT_READY but match is finished. Ignoring.`);
            return;
        }

        if (session.users.has(userId)) {
            session.users.get(userId)!.isReady = false;
            console.log(`[${pairKey}] User ${userId} is NOT READY`);
        }
    }

    // 3. Iniciar Partida
    private tryStartMatch(pairKey: string, session: MatchSession) {
        // Necesitamos exactamente 2 usuarios listos
        if (session.users.size !== 2) {
            console.log(`[${pairKey}] Waiting for 2 users. Current: ${session.users.size}`);
            return;
        }

        const users = Array.from(session.users.values());
        const allReady = users.every(u => u.isReady);

        if (!allReady) {
            console.log(`[${pairKey}] Not all users ready. Ready count: ${users.filter(u => u.isReady).length}/2`);
            return;
        }

        if (!this.problemsLoaded) {
            console.log(`[${pairKey}] Problems not loaded yet`);
            return;
        }

        // Buscar problema
        const problem = this.findFairProblem(users[0], users[1]);

        if (!problem) {
            console.log(`[${pairKey}] No fair problem found for these users`);
            return;
        }

        // Iniciar partida
        session.currentProblem = problem;
        session.isActive = true;

        const msg = {
            action: 'START_MATCH',
            data: problem
        };

        users.forEach(u => u.ws.send(JSON.stringify(msg)));
        console.log(`[${pairKey}] Match started: ${problem.name}`);
    }

    // 4. Verificar Victoria (CHECK)
    async checkWinCondition(pairKey: string, userId: number) {
        const session = this.sessions.get(pairKey);
        if (!session || !session.isActive || !session.currentProblem) {
            console.log(`[${pairKey}] Invalid session state for check`);
            return;
        }

        // No permitir CHECK si el match ya terminó
        if (session.isFinished) {
            console.log(`[${pairKey}] User ${userId} tried CHECK but match is finished. Ignoring.`);
            return;
        }

        const user = session.users.get(userId);
        if (!user || !user.handle) return;

        // Verificar en Codeforces si resolvió el problema actual
        const isSolved = await this.verifySpecificProblem(user.handle, session.currentProblem);

        if (isSolved) {
            // Usuario ganó
            user.ws.send(JSON.stringify({ action: 'WINNER' }));
            console.log(`[${pairKey}] User ${userId} WINNER`);

            // Notificar al otro usuario
            for (const [otherId, otherUser] of session.users) {
                if (otherId !== userId) {
                    otherUser.ws.send(JSON.stringify({ action: 'LOSER' }));
                    console.log(`[${pairKey}] User ${otherId} LOSER`);
                }
            }

            // Terminar partida
            session.isActive = false;
            session.isFinished = true; // Marcar como terminado
            session.currentProblem = null;
            session.users.forEach(u => u.isReady = false);
        } else {
            // Continuar
            user.ws.send(JSON.stringify({ action: 'CONTINUE' }));
        }
    }

    // --- Helpers de Codeforces ---

    private findFairProblem(userA: UserState, userB: UserState): CFProblem | null {
        const candidates = this.allProblemsCache.filter(p =>
            !userA.solvedProblems.has(`${p.contestId}-${p.index}`) &&
            !userB.solvedProblems.has(`${p.contestId}-${p.index}`)
        );

        if (candidates.length === 0) return null;
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    private async fetchUserSolved(handle: string): Promise<Set<string>> {
        const solved = new Set<string>();
        try {
            await this.waitForRateLimit();
            const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
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

    private async verifySpecificProblem(handle: string, problem: CFProblem): Promise<boolean> {
        try {
            await this.waitForRateLimit();
            const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=5`);
            const data = await res.json();

            if (data.status === "OK" && data.result) {
                return data.result.some((sub: any) =>
                    sub.verdict === "OK" &&
                    sub.problem.contestId === problem.contestId &&
                    sub.problem.index === problem.index
                );
            }
        } catch (e) {
            console.error(`Error verifying problem for ${handle}:`, e);
        }
        return false;
    }
}