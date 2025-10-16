import Elysia, {t} from "elysia";
import ContestTreesCache from "../../utils/contest-tree/contest-trees-cache";
import { MongoAdapter } from "../../db/mongo/mongo.adapter";
import { createContestTree, getAllContestTrees } from "./handlers";
import { ContestTreeSchema } from "../../utils/contest-tree/contest-tree-schema";

export const matchmaking = new Elysia({prefix: "/matchmaking"})
    .state("user", {})
    .get("", getAllContestTrees)
    .post("", createContestTree, {
        body: ContestTreeSchema
    });
