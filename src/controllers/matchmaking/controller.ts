import Elysia, {t} from "elysia";
import { createContestTree, getAllContestTrees, getContestTreeByContestId, getContestTreeByRankId } from "./handlers";
import { ContestTreeSchema } from "../../utils/contest-tree/contest-tree-schema";

export const matchmaking = new Elysia({prefix: "/matchmaking"})
    .state("user", {})
    .get("", async (context) => { return getAllContestTrees(context)})
    .get("rank/:rank_id", async (context) => {
        return getContestTreeByRankId(context.params.rank_id);
    })
    .get("contest/:contest_id", async (context) => {
        return getContestTreeByContestId(parseInt(context.params.contest_id));
    })
    .post("", async (context) => { return createContestTree(context)}, {
        body: ContestTreeSchema
    });