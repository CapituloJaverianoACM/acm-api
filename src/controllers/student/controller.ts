import Elysia from "elysia";
import {
    CreateStudentSchema,
    UpdateStudentSchema,
    BulkIdQuery,
} from "../../utils/schemas/student";
import { StudentService } from "../../services/StudentService";
import { SupabaseAdapter } from "../../db/supabase/supabase.adapter";
import { ENTITY_FILTER_SCHEMAS, getEntityFilters } from "../../utils/filters";
import { BadRequest, Created, Ok } from "../../utils/responses";
import { jwtPlugin } from "../../utils/macros/auth";

const studentService = new StudentService(new SupabaseAdapter());

export const students = new Elysia({ prefix: "/students" })
    .get("/", async (context) => {
        const { filters, order, suborder, limit, offset } = getEntityFilters(
            context,
            "student" as keyof typeof ENTITY_FILTER_SCHEMAS,
        );

        const result = await studentService.getAll(
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
        const result = await studentService.getOne(parseInt(context.params.id));

        if (result.error) return BadRequest(context, result.error);
        return Ok(context, result.data);
    })
    .get("/supabase/:id", async (context) => {
        const result = await studentService.getBySupabaseId(context.params.id);

        if (result.error) return BadRequest(context, result.error);
        return Ok(context, result.data);
    })
    .post(
        "/bulk-query/id",
        async (context) => {
            const result = await studentService.getBulkById(context.body.ids);

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            body: BulkIdQuery,
        },
    )
    .use(jwtPlugin)
    .post(
        "/create",
        async (context) => {
            const result = await studentService.create(context.body);

            if (result.error) return BadRequest(context, result.error);
            return Created(context, result.data);
        },
        {
            body: CreateStudentSchema,
            isAdmin: true,
        },
    )
    .put(
        "/:id",
        async (context) => {
            const result = await studentService.update(
                parseInt(context.params.id),
                context.body,
            );

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        {
            body: UpdateStudentSchema,
            isSelf: ["params.id"],
        },
    )
    .delete(
        "/:id",
        async (context) => {
            const result = await studentService.delete(parseInt(context.params.id));

            if (result.error) return BadRequest(context, result.error);
            return Ok(context, result.data);
        },
        { isAdmin: true },
    );
