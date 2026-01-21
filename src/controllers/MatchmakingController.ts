import Elysia, { t } from "elysia";
import {
    ContestIdParamSchema,
    CreateMatchmakingSchema,
} from "../utils/schemas/matchmaking";
import { MatchmakingService } from "../services/MatchmakingService";
import { MongoAdapter } from "../db/mongo/mongo.adapter";
import { SupabaseAdapter } from "../db/supabase/supabase.adapter";
import { BadRequest, Ok } from "../utils/responses";
import { jwtPlugin } from "../utils/macros/auth";
import { NumericString } from "../utils/schemas/lib";

const matchmakingService = new MatchmakingService(
    new MongoAdapter(),
    new SupabaseAdapter(),
);

export const matchmaking = new Elysia({ prefix: "/matchmaking" })
    .get(
        "/tree/:contest_id",
        async (context) => {
            const result = await matchmakingService.getTreeByContestId(
                parseInt(context.params.contest_id),
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            params: ContestIdParamSchema,
        },
    )
    .use(jwtPlugin)
    .get(
        "/opponent/:contest_id/:student_id",
        async (context) => {
            const { contest_id, student_id } = context.params;
            const result = await matchmakingService.getOpponent(
                parseInt(contest_id),
                parseInt(student_id),
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            params: t.Object({
                contest_id: NumericString,
                student_id: NumericString,
            }),
            isSelf: ["params.student_id"],
        },
    )
    .delete(
        "/tree/:contest_id",
        async (context) => {
            const result = await matchmakingService.deleteTreeByContestId(
                parseInt(context.params.contest_id),
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, { message: "Matchmaking tree deleted successfully" });
        },
        {
            params: ContestIdParamSchema,
            isAdmin: true,
        },
    )
    .post(
        "/create",
        async (context) => {
            const result = await matchmakingService.create(
                (context.body as any).contest_id,
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            body: CreateMatchmakingSchema,
            isAdmin: true,
        },
    );
