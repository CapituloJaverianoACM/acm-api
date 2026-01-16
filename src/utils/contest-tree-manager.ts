import { IDatabase } from "../db/database.interface";
import { MongoAdapter } from "../db/mongo/mongo.adapter";
import { MatchmakingTreeNode } from "./matchmaking-tree";

const COLLECTION = "matchmaking";
const db: IDatabase = new MongoAdapter();

export var catcheContestTree: Map<number, MatchmakingTreeNode> = new Map();

export async function getTreeByContestId(contestId: number) {
    if (catcheContestTree.has(contestId)) {
        const node = catcheContestTree.get(contestId)!;
        // Re-insertar para moverla al final (más recientemente usada)
        catcheContestTree.delete(contestId);
        catcheContestTree.set(contestId, node);
        return node;
    }
    const result = await db.getBy(COLLECTION, { contest_id: contestId });
    if (!result.error) {
        const treeData = result.data.tree;
        const rootNode = treeData as MatchmakingTreeNode;
        catcheContestTree.set(contestId, rootNode);
        if (catcheContestTree.size > 5) {
            // Delete oldest cache
            const firstKey = catcheContestTree.keys().next().value;
            if (firstKey !== undefined) catcheContestTree.delete(firstKey);
        }
        return rootNode;
    }
    return null;
}
