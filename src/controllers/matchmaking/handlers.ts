import { Context } from "elysia";
import { IDatabase } from "../../db/database.interface";
import { MongoAdapter } from "../../db/mongo/mongo.adapter";
import { ContestTree } from "../../utils/contest-tree/contest-tree-schema";

const COLLECTION: string = "matchmaking";
const db: IDatabase = new MongoAdapter();

export const getAllContestTrees = async (context: Context) => {
    // start a thread to get all contest trees from db
    const result = await db.getAll(COLLECTION);
    if (result.error) return null;
    return result.data;
}

export const createContestTree = async (context: Context, contestTree: ContestTree) => {
    console.log("Creating contest tree for contest", contestTree.contest_id);
    // save or update a contest tree in db
    const existing = await db.getBy(COLLECTION, {contest_id: contestTree.contest_id});
    if (existing.error) return null;
    if (existing.data) {
        const result = await db.update(COLLECTION, {contest_id: contestTree.contest_id}, contestTree);
        if (result.error) return null;
        return result.data;
    } else {
        const result = await db.insert(COLLECTION, contestTree);
        if (result.error) return null;
        return result.data;
    }
}