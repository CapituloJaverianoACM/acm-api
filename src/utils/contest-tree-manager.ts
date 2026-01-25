import { IDatabase } from "../db/database.interface";
import { MongoAdapter } from "../db/mongo/mongo.adapter";
import { MatchmakingTreeNode } from "./matchmaking-tree";

const COLLECTION = "matchmaking";
const db: IDatabase = new MongoAdapter();
const CACHE_TREE_SIZE = 5;

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
    if (catcheContestTree.size > CACHE_TREE_SIZE) {
      // Delete oldest cache
      const firstKey = catcheContestTree.keys().next().value;
      if (firstKey !== undefined) catcheContestTree.delete(firstKey);
    }
    return rootNode;
  }
  return null;
}

export async function deleteTreeById(contestId: number) {
  // Eliminar del cache
  if (catcheContestTree.has(contestId)) {
    catcheContestTree.delete(contestId);
  }

  // Eliminar de la base de datos
  const result = await db.delete(COLLECTION, { contest_id: contestId });
  return result;
}

export async function updateTreeByContestId(
  contestId: number,
  tree: MatchmakingTreeNode,
) {
  if (!catcheContestTree.has(contestId)) {
    return { error: "Tree not found in cache", data: null };
  }
  // Re-insertar para moverla al final (más recientemente usada)
  catcheContestTree.delete(contestId);
  catcheContestTree.set(contestId, tree);

  const result = await db.update(
    COLLECTION,
    { contest_id: contestId },
    { tree },
  );

  return result;
}