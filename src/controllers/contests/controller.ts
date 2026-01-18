import Elysia from "elysia";
import {
    CreateContestSchema,
    UpdateContestSchema,
} from "../../utils/schemas/contest";
import { BulkIdQuery } from "../../utils/schemas/student";
import { ContestService } from "../../services/ContestService";
import { SupabaseAdapter } from "../../db/supabase/supabase.adapter";
import { ENTITY_FILTER_SCHEMAS, getEntityFilters } from "../../utils/filters";
import { BadRequest, Created, Ok } from "../../utils/responses";
import { jwtPlugin } from "../../utils/macros/auth";

const contestService = new ContestService(new SupabaseAdapter());

export const contests = new Elysia({ prefix: "/contests" })
    .get("/", async (context) => {
        const wPicture =
            new URL(context.request.url).searchParams.get("picture") == "1";

        const { filters, order, suborder, limit, offset } = getEntityFilters(
            context,
            "contest" as keyof typeof ENTITY_FILTER_SCHEMAS,
        );

        const result = await contestService.getAll(
            filters,
            order,
            suborder,
            limit,
            offset,
            wPicture,
        );

        if (result.error) return BadRequest(context, result.error);
        return Ok(context, result.data);
    })
    .get("/:id", async (context) => {
        const wPicture =
            new URL(context.request.url).searchParams.get("picture") == "1";

        const result = await contestService.getOne(
            parseInt(context.params.id),
            wPicture,
        );

        if (result.error) return BadRequest(context, result.error);
        return Ok(context, result.data);
    })
    .post(
        "/bulk-query/id",
        async (context) => {
            const result = await contestService.getBulkById(context.body.ids);

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            body: BulkIdQuery,
        },
    )
    // -------------------- AUTHENTICATED ------------------------------
    .use(jwtPlugin)
    .post(
        "/create",
        async (context) => {
            const result = await contestService.create(context.body);

            if (result.error) return BadRequest(context, result.error);
            return Created(context, result.data);
        },
        {
            body: CreateContestSchema,
            isAdmin: true,
        },
    )
    .put(
        "/:id",
        async (context) => {
            const result = await contestService.update(
                parseInt(context.params.id),
                context.body,
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            body: UpdateContestSchema,
            isAdmin: true,
        },
    )
    .delete(
        "/:id",
        async (context) => {
            const result = await contestService.delete(parseInt(context.params.id));

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        { isAdmin: true },
    );
