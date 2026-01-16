import Elysia from "elysia";
import { verifyJWT } from "../../utils/auth";
import { ContestIdParamSchema, CreateMatchmakingSchema } from "../../utils/schemas/matchmaking";
import { createMatchmaking, getMatchmakingTree } from "./handlers";

export const matchmaking = new Elysia({ prefix: "/matchmaking" })
    .state("user", {})
    .get("/tree/:contest_id", getMatchmakingTree, {
        params: ContestIdParamSchema
    })
    .post("/create", createMatchmaking, {
        beforeHandle: verifyJWT,
        body: CreateMatchmakingSchema,
    });
