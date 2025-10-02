import { Context } from "elysia";
import { BadRequest, Created, Ok } from "../../utils/responses";
import { IDatabase } from "../../db/database.interface";
import { SupabaseAdapter } from "../../db/supabase/supabase.adapter";
import { ENTITY_FILTER_SCHEMAS, getEntityFilters } from "../../utils/filters";

const COLLECTION: string = "student";
const db: IDatabase = new SupabaseAdapter();

export const getAllStudents = async (context: Context) => {
  const { filters, order, suborder, limit, offset } = getEntityFilters(
    context,
    COLLECTION as keyof typeof ENTITY_FILTER_SCHEMAS,
  );

  // Si hay filtros, usar getBy, sino usar getAll
  const result =
    Object.keys(filters).length > 0
      ? await db.getBy(COLLECTION, filters, order, suborder, limit, offset)
      : await db.getAll(COLLECTION, order, suborder, limit, offset);

  if (result.error) return BadRequest(context, result.error);
  return Ok(context, result.data);
};

export const getOneStudent = async (context: Context) => {
  const result = await db.getBy(COLLECTION, {
    id: parseInt(context.params.id),
  });

  if (result.error) return BadRequest(context, result.error);

  return Ok(context, result.data);
};

export const getStudentBySupabase = async (context: Context) => {
  const result = await db.getBy(COLLECTION, {
    supabase_user_id: context.params.id
  });

  if (result.error) return BadRequest(context, result.error);
}

export const createStudent = async (context: Context) => {
  const insertMember = await db.insert(COLLECTION, context.body);

  if (insertMember.error) return BadRequest(context, insertMember.error);

  return Created(context, insertMember.data);
};

export const updateStudent = async (context: Context) => {
  const member = await db.getBy(COLLECTION, {
    id: parseInt(context.params.id),
  });

  if (member.error) return BadRequest(context, member.error);

  const result = await db.update(
    COLLECTION,
    { id: parseInt(context.params.id) },
    context.body,
  );

  if (result.error) return BadRequest(context, result.error);

  return Ok(context, result.data);
};

export const deleteStudent = async (context: Context) => {
  const member = await db.getBy(COLLECTION, {
    id: parseInt(context.params.id),
  });
  if (member.error) return BadRequest(context, member.error);

  const result = await db.delete(COLLECTION, {
    id: parseInt(context.params.id),
  });

  if (result.error) return BadRequest(context, result.error);
  return Ok(context, result.data);
};

export const getStudentsBulkId = async (context: Context) => {
  const options = context.body.ids;

  const result = await db.getMultiple(COLLECTION, "id", options);
  if (result.error) return BadRequest(context, result.error);
  return Ok(context, result.data);
};
