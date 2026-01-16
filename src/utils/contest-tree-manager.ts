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
    else {
        const result = await db.getBy(COLLECTION, { contestId: contestId });
        if (!result.error && result.data.length > 0) {
            const treeData = result.data[0].tree;
            const rootNode = treeData as MatchmakingTreeNode;
            catcheContestTree.set(contestId, rootNode);
            if (catcheContestTree.size > 5) {
                // Delete oldest cache
                const firstKey = catcheContestTree.keys().next().value;
                if (firstKey !== undefined)
                    catcheContestTree.delete(firstKey);
            }
            return rootNode;
        } else {
            return null;
        }

    }
}