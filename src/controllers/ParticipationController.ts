import Elysia, { t } from "elysia";
import {
    CreateParticipationSchema,
    UpdateParticipationSchema,
} from "../utils/schemas/participation";
import { NumericString } from "../utils/schemas/lib";
import { ParticipationService } from "../services/ParticipationService";
import { SupabaseAdapter } from "../db/supabase/supabase.adapter";
import { ENTITY_FILTER_SCHEMAS, getEntityFilters } from "../utils/filters";
import { BadRequest, Created, Ok } from "../utils/responses";
import { jwtPlugin } from "../utils/macros/auth";

const participationService = new ParticipationService(new SupabaseAdapter());

export const participation = new Elysia({ prefix: "/participation" })
    .get("/", async (context) => {
        const { filters, order, suborder, limit, offset } = getEntityFilters(
            context,
            "participation" as keyof typeof ENTITY_FILTER_SCHEMAS,
        );

        const result = await participationService.getAll(
            filters,
            order,
            suborder,
            limit,
            offset,
        );

        if (result.error) return BadRequest(context, result.error);
        return Ok(context, result.data);
    })
    .get(
        "/contest/:contest_id",
        async (context) => {
            const result = await participationService.getByContestId(
                parseInt(context.params.contest_id),
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            params: t.Object({
                contest_id: NumericString,
            }),
        },
    )
    .get(
        "/student/:student_id",
        async (context) => {
            const result = await participationService.getByStudentId(
                parseInt(context.params.student_id),
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            params: t.Object({
                student_id: NumericString,
            }),
        },
    )
    .get(
        "/:contest_id/:student_id",
        async (context) => {
            const result = await participationService.getOne(
                parseInt(context.params.contest_id),
                parseInt(context.params.student_id),
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            params: t.Object({
                contest_id: NumericString,
                student_id: NumericString,
            }),
        },
    )
    .use(jwtPlugin)
    .post(
        "/create",
        async (context) => {
            const result = await participationService.create(context.body);

            if (result.error) return BadRequest(context, result.error);
            return Created(context, result.data);
        },
        {
            body: CreateParticipationSchema,
            isSelf: ["body.student_id"],
        },
    )
    .put(
        "/:contest_id/:student_id",
        async (context) => {
            const result = await participationService.update(
                parseInt(context.params.contest_id),
                parseInt(context.params.student_id),
                context.body,
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            body: UpdateParticipationSchema,
            isSelf: ["params.student_id"],
        },
    )
    .delete(
        "/:contest_id/:student_id",
        async (context) => {
            const result = await participationService.delete(
                parseInt(context.params.contest_id),
                parseInt(context.params.student_id),
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            isSelf: ["params.student_id"],
        },
    );
