import { t } from "elysia";
import { ContestTreeNodeSchema } from "./contest-tree-node";

export const ContestTreeSchema = t.Object({
  rank_id: t.String({ description: "MongoDB ObjectId como string" }),
  contest_id: t.Integer(),
  tree: ContestTreeNodeSchema
});

export type ContestTree = typeof ContestTreeSchema.static;
