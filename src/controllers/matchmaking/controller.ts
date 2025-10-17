import Elysia, {t} from "elysia";
import { 
    createContestTree, 
    getAllContestTrees, 
    getContestTreeByContestId, 
    getContestTreeByRankId, 
    updateContestTreeByContestId, 
    updateContestTreeByRankId } from "./handlers";
import { ContestTreeSchema } from "../../utils/contest-tree/contest-tree-schema";

export const matchmaking = new Elysia({prefix: "/matchmaking"})
    .state("user", {})
    .post("", async (context) => { return createContestTree(context)}, {
        body: ContestTreeSchema
    })
    .get("", async (context) => { return getAllContestTrees(context)})
    .get("rank/:rank_id", async (context) => {
        return getContestTreeByRankId(context.params.rank_id);
    })
    .get("contest/:contest_id", async (context) => {
        return getContestTreeByContestId(parseInt(context.params.contest_id));
    })
    .put("/contest/:contest_id", async (context) => { 
        return updateContestTreeByContestId(parseInt(context.params.contest_id), context.body); 
    }, {
        body: ContestTreeSchema
    })
    .put("/rank/:rank_id", async (context) => { 
        return updateContestTreeByRankId(context.params.rank_id, context.body);
    }, {
        body: ContestTreeSchema
    });