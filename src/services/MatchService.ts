import { StudentService } from "./StudentService";

export type CFProblem = {
  contestId: number;
  index: string;
  name: string;
  rating: number | null;
};

export type SolvedProblem = {
  contestId: number;
  index: string;
  name: string;
  rating: number;
};

export type MatchConnectionData = {
  pairKey: string;
  connId: string;
  handles: {
    own: string | null;
    opponent: string | null;
  };
  problems: {
    own: SolvedProblem[];
    opponent: SolvedProblem[];
  };
};

export class MatchService {
  private matchPairs = new Map<string, Set<string>>();
  private readyStates = new Map<string, { menor: boolean; mayor: boolean }>();
  private usedProblems = new Set<string>();

  // Cache for all CF problems
  private allCFProblems: CFProblem[] = [];
  private allCFProblemsTimestamp = 0;

  // Codeforces rate-limiter and cache
  private readonly CF_RATE_LIMIT_MS = 2000;
  private cfLastRequest = 0;
  private cfCache = new Map<
    string,
    { timestamp: number; problems: SolvedProblem[] }
  >();
  private cfPending = new Map<string, Promise<SolvedProblem[]>>();

  constructor(private studentService: StudentService) { }

  async prepareConnectionData(
    ownID: number,
    opponentID: number,
  ): Promise<MatchConnectionData> {
    const sortedIds = [ownID, opponentID].sort((a, b) => a - b);
    const pairKey = `${sortedIds[0]}-${sortedIds[1]}`;
    const connId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const fetchHandle = async (id: number) => {
      const result = await this.studentService.getOne(id);
      if (result.error) return null;
      const record = Array.isArray(result.data)
        ? result.data[0]
        : result.data;
      return record?.codeforces_handle ?? null;
    };

    const handles = {
      own: await fetchHandle(ownID),
      opponent: await fetchHandle(opponentID),
    };

    const problems = {
      own: await this.getSolvedProblemsRateLimited(handles.own),
      opponent: await this.getSolvedProblemsRateLimited(handles.opponent),
    };

    return {
      pairKey,
      connId,
      handles,
      problems,
    };
  }

  async handleConnectionOpen(pairKey: string, connId: string): Promise<void> {
    if (!this.matchPairs.has(pairKey)) {
      this.matchPairs.set(pairKey, new Set());
    }
    this.matchPairs.get(pairKey)!.add(connId);

    if (!this.readyStates.has(pairKey)) {
      this.readyStates.set(pairKey, { menor: false, mayor: false });
    }

    console.log("open pair", { pairKey, connId });
  }

  async handleConnectionClose(pairKey: string, connId: string): Promise<void> {
    const pairSet = this.matchPairs.get(pairKey);
    if (pairSet) {
      pairSet.delete(connId);
      if (pairSet.size === 0) {
        this.matchPairs.delete(pairKey);
      }
    }

    if (this.readyStates.has(pairKey)) {
      this.readyStates.delete(pairKey);
    }
  }

  async handleReadyAction(
    pairKey: string,
    ownID: number,
    opponentID: number,
    problems: { own: SolvedProblem[]; opponent: SolvedProblem[] },
  ): Promise<{
    action: string;
    pairKey: string;
    problem: {
      contestId: number;
      index: string;
      name: string;
      rating: number;
    } | null;
  } | null> {
    const state = this.readyStates.get(pairKey)!;
    if (ownID < opponentID) state.menor = true;
    else state.mayor = true;

    if (state.menor && state.mayor) {
      const selected = await this.selectNextProblem(
        problems.own,
        problems.opponent,
      );
      return {
        action: "START_CONTEST",
        pairKey,
        problem: selected
          ? {
            contestId: selected.contestId,
            index: selected.index,
            name: selected.name,
            rating: selected.rating,
          }
          : null,
      };
    }

    return null;
  }

  handleNotReadyAction(
    pairKey: string,
    ownID: number,
    opponentID: number,
  ): void {
    const state = this.readyStates.get(pairKey)!;
    if (ownID < opponentID) state.menor = false;
    else state.mayor = false;
  }

  private async fetchAllCFProblems(): Promise<CFProblem[]> {
    const now = Date.now();
    if (
      this.allCFProblems.length > 0 &&
      now - this.allCFProblemsTimestamp < 60 * 60 * 1000
    ) {
      return this.allCFProblems;
    }

    const resp = await fetch("https://codeforces.com/api/problemset.problems");
    const data = await resp.json();
    if (!data || data.status !== "OK" || !Array.isArray(data.result?.problems)) {
      return [];
    }

    this.allCFProblems = data.result.problems.map((p: any) => ({
      contestId: p.contestId,
      index: p.index,
      name: p.name,
      rating: p.rating ?? null,
    }));
    this.allCFProblemsTimestamp = now;
    return this.allCFProblems;
  }

  private async fetchUserSolvedProblems(
    handle: string | null,
  ): Promise<SolvedProblem[]> {
    if (!handle) return [];
    const resp = await fetch(
      `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`,
    );
    const data = await resp.json();
    if (!data || data.status !== "OK" || !Array.isArray(data.result))
      return [];
    const unique = new Map<string, SolvedProblem>();
    for (const submission of data.result) {
      if (submission && submission.verdict === "OK" && submission.problem) {
        const { contestId, index, name, rating } = submission.problem;
        if (rating === undefined || rating < 800 || rating > 1000) continue;
        const key = `${contestId}-${index}`;
        if (!unique.has(key))
          unique.set(key, { contestId, index, name, rating });
      }
    }
    return Array.from(unique.values());
  }

  private async getSolvedProblemsRateLimited(
    handle: string | null,
  ): Promise<SolvedProblem[]> {
    if (!handle) return [];

    // If already cached, return immediately
    const cached = this.cfCache.get(handle);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.problems;
    }

    // If a request is already pending for this handle, wait for it instead of making a duplicate
    if (this.cfPending.has(handle)) {
      return this.cfPending.get(handle)!;
    }

    // Create and track the promise
    const promise = (async () => {
      const now = Date.now();
      const waitMs = this.CF_RATE_LIMIT_MS - (now - this.cfLastRequest);
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
      this.cfLastRequest = Date.now();

      const problems = await this.fetchUserSolvedProblems(handle);
      this.cfCache.set(handle, { timestamp: Date.now(), problems });
      return problems;
    })();

    this.cfPending.set(handle, promise);
    const result = await promise;
    this.cfPending.delete(handle);
    return result;
  }

  private async selectNextProblem(
    ownProblems: SolvedProblem[],
    opponentProblems: SolvedProblem[],
  ): Promise<SolvedProblem | null> {
    const allProblems = await this.fetchAllCFProblems();

    const solvedSet = new Set<string>();
    for (const p of ownProblems) solvedSet.add(`${p.contestId}-${p.index}`);
    for (const p of opponentProblems)
      solvedSet.add(`${p.contestId}-${p.index}`);

    const candidates = allProblems
      .filter((p) => {
        if (p.rating === null || p.rating < 800 || p.rating > 1000)
          return false;
        const key = `${p.contestId}-${p.index}`;
        return !solvedSet.has(key) && !this.usedProblems.has(key);
      })
      .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));

    if (candidates.length === 0) return null;

    const selected = candidates[0] as SolvedProblem;
    const key = `${selected.contestId}-${selected.index}`;
    this.usedProblems.add(key);

    return selected;
  }
}
