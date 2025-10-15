import { ContestTree } from "./contest-tree";
import {t} from "elysia";

class ContestCache {
  private static instance: ContestCache;
  private cache: ContestTree[] = [];
  private readonly maxSize = 3;

  private constructor() {}

  public static getInstance(): ContestCache {
    if (!ContestCache.instance) {
      ContestCache.instance = new ContestCache();
      console.log("🧩 ContestCache inicializado");
    }
    return ContestCache.instance;
  }

  public add(tree: ContestTree): void {
    if (this.cache.length >= this.maxSize) {
      // Elimina el más antiguo (FIFO)
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

export default ContestCache;
