import Elysia from "elysia";
import { verifyJWT } from "../../utils/auth";
import { CreateMatchmakingSchema } from "../../utils/schemas/matchmaking";
import { createMatchmaking } from "./handlers";

export const matchmaking = new Elysia({ prefix: "/matchmaking" })
    .state("user", {})
    .post("/create", createMatchmaking, {
        beforeHandle: verifyJWT,
        body: CreateMatchmakingSchema,
    });
