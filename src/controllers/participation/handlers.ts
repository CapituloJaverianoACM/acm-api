import { Context } from "elysia";
import { BadRequest, Created, Ok } from "../../utils/responses";
import { IDatabase } from "../../db/database.interface";
import { SupabaseAdapter } from "../../db/supabase/supabase.adapter";
import { CreateParticipationSchema, UpdateParticipationSchema } from "../../utils/entities";
import { ENTITY_FILTER_SCHEMAS, getEntityFilters } from "../../utils/filters";

const COLLECTION: string = "participation";
const db: IDatabase = new SupabaseAdapter();

export const getAllParticipations = async (context: Context) => {
    const { filters, order, suborder, limit, offset } = getEntityFilters(context, COLLECTION as keyof typeof ENTITY_FILTER_SCHEMAS);

    // Si hay filtros, usar getBy, sino usar getAll
    const result = Object.keys(filters).length > 0
        ? await db.getBy(COLLECTION, filters, order, suborder, limit, offset)
        : await db.getAll(COLLECTION, order, suborder, limit, offset);

    if (result.error) return BadRequest(context, result.error);
    return Ok(context, result.data);
};

export const getOneParticipation = async (context: Context) => {
    const { contest_id, student_id } = context.params;
    const result = await db.getBy(COLLECTION, {
        contest_id: parseInt(contest_id),
        student_id: parseInt(student_id),
    });
    if (result.error) return BadRequest(context, "Participation does not exist.");

    return Ok(context, result.data);
};

export const getParticipationsByContestId = async (context: Context) => {
    const { contest_id } = context.params;
    const resultsQuery = { contest_id: parseInt(contest_id) };

    const result = await db.getBy(COLLECTION, resultsQuery);

    if (result.error) return BadRequest(context, result.error);

    return Ok(context, result.data);
}

export const getParticipationsByStudentId = async (context: Context) => {
    const { student_id } = context.params;
    const resultsQuery = { student_id: parseInt(student_id) };

    const result = await db.getBy(COLLECTION, resultsQuery);

    if (result.error) return BadRequest(context, result.error);

    return Ok(context, result.data);
}

export const createParticipation = async (context: (Context & {
    body: typeof CreateParticipationSchema
})) => {
    const participation = await db.getBy(COLLECTION, {
        contest_id: context.body.contest_id,
        student_id: context.body.student_id,
    });

    if (participation.data && participation.data.length > 0)
        return BadRequest(context, "Participation already exists for this student and contest.");

    const resultInsert = await db.insert(COLLECTION, context.body);

    if (resultInsert.error) return BadRequest(context, resultInsert.error);

    return Created(context, resultInsert.data);
}

export const updateParticipation = async (context: (Context & {
    body: typeof UpdateParticipationSchema
})) => {
    const { contest_id, student_id } = context.params;

    // Se utiliza la clave primaria compuesta (contest_id, student_id) para encontrar el registro.
    const toUpdt = await db.getBy(COLLECTION, {
        contest_id: parseInt(contest_id),
        student_id: parseInt(student_id),
    });

    if (toUpdt.error)
        return BadRequest(context, "This participation does not exist.");

    const resultUpdate = await db.update(
        COLLECTION,
        { contest_id: parseInt(contest_id), student_id: parseInt(student_id) },
        context.body,
    );

    if (resultUpdate.error) return BadRequest(context, resultUpdate.error);

    return Ok(context, resultUpdate.data);
};

export const deleteParticipation = async (context: Context) => {
    const { contest_id, student_id } = context.params;
    const toDel = await db.getBy(COLLECTION, {
        contest_id: parseInt(contest_id),
        student_id: parseInt(student_id),
    });

    if (toDel.error) return BadRequest(context, "This participation does not exist.");

    const resultDelete = await db.delete(COLLECTION, {
        contest_id: parseInt(contest_id),
        student_id: parseInt(student_id),
    });
    if (resultDelete.error) return BadRequest(context, resultDelete.error);

    return Ok(context, resultDelete.data);
};