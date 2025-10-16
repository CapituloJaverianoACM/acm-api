import { t } from "elysia";
import { ContestTreeNodeSchema } from "./contest-tree-node-schema";

export const ContestTreeSchema = t.Object({
  rank_id: t.String(),
  contest_id: t.Integer(),
  tree: ContestTreeNodeSchema
});

export type ContestTree = typeof ContestTreeSchema.static;
