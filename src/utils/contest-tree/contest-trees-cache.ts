import { ContestTree } from "./contest-tree-schema";
import {t} from "elysia";

class ContestTreesCache {
  private static instance: ContestTreesCache;
  private cache: ContestTree[] = [];
  private readonly maxSize = 3;
  // Key value (rank_id, call_count)
  private call_counter : Record<string, number> = {};
  // Minimum number of calls to save a tree in cache
  private min_calls = 0;

  private constructor() {}

  public static getInstance(): ContestTreesCache {
    if (!ContestTreesCache.instance) {
      ContestTreesCache.instance = new ContestTreesCache();
      console.log("🧩 ContestCache inicializado");
    }
    return ContestTreesCache.instance;
  }

  public add(tree: ContestTree): void {
    if (this.cache.length >= this.maxSize) {
      this.cache.shift();
    }
    this.cache.push(tree);
  }

  public getAll(): ContestTree[] {
    return [...this.cache];
  }

  public getByContest(contest_id: number): ContestTree | undefined {
    return this.cache.find((t) => t.contest_id === contest_id);
  }

  public getByRank(rank_id: string): ContestTree | undefined {
    return this.cache.find((t) => t.rank_id === rank_id);
  }

  public count_call(contestTree: ContestTree): number {
    if (!this.call_counter[contestTree.rank_id]) {
      this.call_counter[contestTree.rank_id] = 1;
    }
    else {
      this.call_counter[contestTree.rank_id] += 1;
    }
    if (this.call_counter[contestTree.rank_id] > this.min_calls) {
      this.add(contestTree);
    }
    return this.call_counter[contestTree.rank_id];
  }

  public clear(): void {
    this.cache = [];
  }
}

export default ContestTreesCache;
