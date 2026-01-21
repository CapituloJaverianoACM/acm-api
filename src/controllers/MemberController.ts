import Elysia, { t } from "elysia";
import {
    CreateMemberSchema,
    UpdateMemberSchema,
} from "../utils/schemas/member";
import { MemberService } from "../services/MemberService";
import { MongoAdapter } from "../db/mongo/mongo.adapter";
import { ENTITY_FILTER_SCHEMAS, getEntityFilters } from "../utils/filters";
import { BadRequest, Ok } from "../utils/responses";
import { jwtPlugin } from "../utils/macros/auth";

const memberService = new MemberService(new MongoAdapter());

export const members = new Elysia({ prefix: "/members" })
    .get("/", async (context) => {
        const { filters, order, suborder, limit, offset } = getEntityFilters(
            context,
            "members" as keyof typeof ENTITY_FILTER_SCHEMAS,
        );

        const result = await memberService.getAll(
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
        const result = await memberService.getOne(parseInt(context.params.id));

        if (result.error) return BadRequest(context, result.error);
        return Ok(context, result.data);
    })
    .use(jwtPlugin)
    .post(
        "/create",
        async (context) => {
            const result = await memberService.create(context.body);

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            body: CreateMemberSchema,
            isAdmin: true,
        },
    )
    .post(
        "/createMany",
        async (context) => {
            const result = await memberService.createMany(context.body);

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            body: t.Array(CreateMemberSchema),
            isAdmin: true,
        },
    )
    .post(
        "/deactivate/:id",
        async (context) => {
            const result = await memberService.deactivate(
                parseInt(context.params.id),
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        { isAdmin: true },
    )
    .put(
        "/:id",
        async (context) => {
            const result = await memberService.update(
                parseInt(context.params.id),
                context.body,
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            body: UpdateMemberSchema,
            isAdmin: true,
        },
    )
    .delete(
        "/:id",
        async (context) => {
            const result = await memberService.delete(parseInt(context.params.id));

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        { isAdmin: true },
    );
