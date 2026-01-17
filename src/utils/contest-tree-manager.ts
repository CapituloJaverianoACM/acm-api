import { IDatabase } from "../db/database.interface";
import { MongoAdapter } from "../db/mongo/mongo.adapter";
import { MatchmakingTreeNode } from "./matchmaking-tree";

const COLLECTION = "contest_trees";
const db: IDatabase = new MongoAdapter();
const catcheContestTree: Map<number, MatchmakingTreeNode> = new Map();

export async function getTreeByContestId(
    contestId: number,
): Promise<MatchmakingTreeNode | null> {

    console.log("Cache", catcheContestTree);

    if (catcheContestTree.has(contestId)) {
        return catcheContestTree.get(contestId)!;
    }

    const result = await db.getBy(COLLECTION, { contestId });

    console.log("DB Result", result);


    if (result.error == null) {
        console.log("Tree found for contestId:", contestId);
        const document = result.data;
        const rootNode = document.tree as MatchmakingTreeNode;
        catcheContestTree.set(contestId, rootNode);

        if (catcheContestTree.size > 5) {
            const firstKey = catcheContestTree.keys().next().value;
            if (firstKey !== undefined) {
                catcheContestTree.delete(firstKey);
            }
        }
        
        return rootNode;
    }

    console.log("No tree found for contestId:", result);
    return null;
}
