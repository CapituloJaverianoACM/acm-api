import Elysia, { t } from "elysia";
import {
    ActivitySchema,
    UpdateActivitySchema,
} from "../utils/schemas/activity";
import { ActivityService } from "../services/ActivityService";
import { MongoAdapter } from "../db/mongo/mongo.adapter";
import { ENTITY_FILTER_SCHEMAS, getEntityFilters } from "../utils/filters";
import { BadRequest, Ok } from "../utils/responses";
import { jwtPlugin } from "../utils/macros/auth";

const activityService = new ActivityService(new MongoAdapter());

export const activity = new Elysia({ prefix: "/activity" })
    .get("/", async (context) => {
        const { filters, order, suborder, limit, offset } = getEntityFilters(
            context,
            "activities" as keyof typeof ENTITY_FILTER_SCHEMAS,
        );

        const result = await activityService.getAll(
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
        const result = await activityService.getOne(context.params.id);

        if (result.error) return BadRequest(context, result.error);
        return Ok(context, result.data);
    })
    .use(jwtPlugin)
    .post(
        "/create",
        async (context) => {
            const result = await activityService.create(context.body);

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            body: ActivitySchema,
            isAdmin: true,
        },
    )
    .post(
        "/createMany",
        async (context) => {
            const result = await activityService.createMany(context.body);

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            body: t.Array(ActivitySchema),
            isAdmin: true,
        },
    )
    .put(
        "/:id",
        async (context) => {
            const result = await activityService.update(
                context.params.id,
                context.body,
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            body: UpdateActivitySchema,
            isAdmin: true,
        },
    )
    .delete(
        "/:id",
        async (context) => {
            const result = await activityService.delete(context.params.id);

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        { isAdmin: true },
    );
