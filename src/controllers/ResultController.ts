import Elysia from "elysia";
import {
    CreateResultSchema,
    UpdateResultSchema,
} from "../utils/schemas/result";
import { IdSupabaseInt4 } from "../utils/schemas/lib";
import { ResultService } from "../services/ResultService";
import { SupabaseAdapter } from "../db/supabase/supabase.adapter";
import { ENTITY_FILTER_SCHEMAS, getEntityFilters } from "../utils/filters";
import { BadRequest, Created, Ok } from "../utils/responses";
import { jwtPlugin } from "../utils/macros/auth";

const resultService = new ResultService(new SupabaseAdapter());

export const results = new Elysia({
    prefix: "/results",
})
    .get("/", async (context) => {
        const { filters, order, suborder, limit, offset } = getEntityFilters(
            context,
            "results" as keyof typeof ENTITY_FILTER_SCHEMAS,
        );

        const result = await resultService.getAll(
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
        "/:id",
        async (context) => {
            const result = await resultService.getOne(context.params.id);

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            params: IdSupabaseInt4,
        },
    )
    .get(
        "/contest/:id",
        async (context) => {
            const result = await resultService.getByContestId(context.params.id);

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            params: IdSupabaseInt4,
        },
    )
    .use(jwtPlugin)
    .post(
        "/create",
        async (context) => {
            const result = await resultService.create(context.body);

            if (result.error) return BadRequest(context, result.error);
            return Created(context, result.data);
        },
        {
            body: CreateResultSchema,
            isAdmin: true
        },
    )
    .put(
        "/:id",
        async (context) => {
            const result = await resultService.update(
                context.params.id,
                context.body,
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            body: UpdateResultSchema,
            params: IdSupabaseInt4,
            isAdmin: true
        },
    )
    .delete(
        "/:id",
        async (context) => {
            const result = await resultService.delete(context.params.id);

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            params: IdSupabaseInt4,
            isAdmin: true
        },
    );
