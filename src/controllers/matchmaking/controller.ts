import Elysia from "elysia";
import { verifyJWT } from "../../utils/auth";
import { ContestIdParamSchema, CreateMatchmakingSchema } from "../../utils/schemas/matchmaking";
import { createMatchmaking, getMatchmakingTree, deleteMatchmakingTree } from "./handlers";

export const matchmaking = new Elysia({ prefix: "/matchmaking" })
    .state("user", {})
    .get("/tree/:contest_id", getMatchmakingTree, {
        params: ContestIdParamSchema
    })
    .delete("/tree/:contest_id", deleteMatchmakingTree, {
        params: ContestIdParamSchema
    } )
    .post("/create", createMatchmaking, {
        beforeHandle: verifyJWT,
        body: CreateMatchmakingSchema,
    });
