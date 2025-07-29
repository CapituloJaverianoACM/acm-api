import { Context } from "elysia";
import { BadRequest, Created, Ok } from "../utils/responses";
import { IDatabase } from "../lib/database.interface";
import { SupabaseAdapter } from "../lib/supabase.adapter";

const COLLECTION: string = "student";
const db: IDatabase = new SupabaseAdapter();

export const getAllStudents = async (context: Context) => {
  const result = await db.getAll(COLLECTION);
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

export const createStudent = async (context: Context) => {

  const insertMember = await db.insert(COLLECTION, context.body);
  
  if(insertMember.error) return BadRequest(context, insertMember.error);

  return Created(context, insertMember.data);
};


export const updateStudent = async (context: Context) => {
  const member = await db.getBy(COLLECTION, {
    id: parseInt(context.params.id)
  });

  if(member.error) return BadRequest(context,member.error);

  const result = await db.update(
    COLLECTION,
    { id: parseInt(context.params.id) },
    context.body,
  );

  if(result.error) return BadRequest(context, result.error);

  return Ok(context, result.data);
};

export const deleteStudent = async (context: Context) => {
  const member = await db.getBy(COLLECTION, {
    id: parseInt(context.params.id)
  });
  if (member.error) return BadRequest(context, member.error);

  const result = await db.delete(
    COLLECTION,
    { id: parseInt(context.params.id) }
  )

  if(result.error) return BadRequest(context, result.error);
  return Ok(context, result.data);
};
