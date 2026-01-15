import { IDatabase } from "../db/database.interface";
import { MongoAdapter } from "../db/mongo/mongo.adapter";
import { MatchmakingTreeNode } from "./matchmaking-tree";

const COLLECTION = "contest_trees";
const db: IDatabase = new MongoAdapter();

export var catcheContestTree: Map<number, MatchmakingTreeNode> = new Map();

export function getTreeByContestId(contestId: number){
    if (catcheContestTree.has(contestId)){
        return catcheContestTree.get(contestId)!;
    }
    else {
        db.getBy(COLLECTION, {contestId: contestId}).then(result => {
            if (!result.error && result.data.length > 0){
                const treeData = result.data[0];
                const rootNode = treeData as MatchmakingTreeNode;
                catcheContestTree.set(contestId, rootNode);
                if (catcheContestTree.size > 5){
                    // Delete oldest cache
                    const firstKey = catcheContestTree.keys().next().value;
                    if (firstKey !== undefined)
                        catcheContestTree.delete(firstKey);
                }
                return rootNode;
            } else {
                return null;
            }
        });
    }
}