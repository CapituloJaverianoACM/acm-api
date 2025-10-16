import { ContestTree } from "./contest-tree-schema";
import {t} from "elysia";

class ContestTreesCache {
  private static instance: ContestTreesCache;
  private cache: ContestTree[] = [];
  private readonly maxSize = 3;

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

  public getByRank(rank_id: string): ContestTree | undefined {
    return this.cache.find((t) => t.rank_id === rank_id);
  }

  public clear(): void {
    this.cache = [];
  }
}

export default ContestTreesCache;
