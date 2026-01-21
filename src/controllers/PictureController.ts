import Elysia from "elysia";
import {
    CreatePictureSchema,
    UpdatePictureSchema,
} from "../utils/schemas/picture";
import { PictureService } from "../services/PictureService";
import { SupabaseAdapter } from "../db/supabase/supabase.adapter";
import { ENTITY_FILTER_SCHEMAS, getEntityFilters } from "../utils/filters";
import { BadRequest, Created, Ok } from "../utils/responses";
import { jwtPlugin } from "../utils/macros/auth";

const pictureService = new PictureService(new SupabaseAdapter());

export const pictures = new Elysia({ prefix: "/pictures" })
    .get("/", async (context) => {
        const { filters, order, suborder, limit, offset } = getEntityFilters(
            context,
            "picture" as keyof typeof ENTITY_FILTER_SCHEMAS,
        );

        const result = await pictureService.getAll(
            filters,
            order,
            suborder,
            limit,
            offset,
        );

        if (result.error) return BadRequest(context, result.error);
        return Ok(context, result.data);
    })
    .get("/:id", async (context) => {
        const result = await pictureService.getOne(parseInt(context.params.id));

        if (result.error) return BadRequest(context, result.error);
        return Ok(context, result.data);
    })
    .use(jwtPlugin)
    .post(
        "/create",
        async (context) => {
            const result = await pictureService.create(context.body);

            if (result.error) return BadRequest(context, result.error);
            return Created(context, result.data);
        },
        {
            body: CreatePictureSchema,
            isAdmin: true,
        },
    )
    .put(
        "/:id",
        async (context) => {
            const result = await pictureService.update(
                parseInt(context.params.id),
                context.body,
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            body: UpdatePictureSchema,
            isAdmin: true,
        },
    )
    .delete(
        "/:id",
        async (context) => {
            const result = await pictureService.delete(parseInt(context.params.id));

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        { isAdmin: true },
    );
