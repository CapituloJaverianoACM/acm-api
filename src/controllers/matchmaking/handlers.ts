import { Context } from "elysia";
import { IDatabase } from "../../db/database.interface";
import { MongoAdapter } from "../../db/mongo/mongo.adapter";
import { ContestTree } from "../../utils/contest-tree/contest-tree-schema";

const COLLECTION: string = "matchmaking";
const db: IDatabase = new MongoAdapter();

// Crud - Create

export const createContestTree = async (context: Context) => {
    const contestTree = context.body as ContestTree;
    const existing = await db.getBy(COLLECTION, { contest_id: contestTree.contest_id });
    if (existing.data){ 
        console.log("Existing contest tree found for contest", contestTree.contest_id, "with rank", existing.data.rank_id);
        return null;
    }

    if (existing.error) {
        const result = await db.insert(COLLECTION, contestTree);
        if (result.error) return null;
        return result.data;
    } else {
        const result = await db.insert(COLLECTION, contestTree);
        if (result.error) return null;
        return result.data;
    }
};

// Crud - Read all

export const getAllContestTrees = async (context: Context) => {
    const result = await db.getAll(COLLECTION);
    const data = Array.isArray(result) ? result : result.data ?? [];

    return data;
};

// Crud - Read by contest id

export const getContestTreeByContestId = async (contest_id: number) => {
    const result = await db.getBy(COLLECTION, { contest_id });
    if (result.error) return null;
    return result.data;
}

// Crud - read by rank id

export const getContestTreeByRankId = async (rank_id: string) => {
  const result = await db.getBy(COLLECTION, { rank_id });
  if (result.error) return null;
  return result.data;
}