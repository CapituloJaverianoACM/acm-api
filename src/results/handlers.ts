import { Context } from "elysia";
import { BadRequest, Created, Ok } from "../utils/responses";
import { IDatabase } from "../lib/database.interface";
import { SupabaseAdapter } from "../lib/supabase.adapter";
import { CreateResultSchema, UpdateResultSchema } from "../utils/entities";

const COLLECTION: string = "results"

const db: IDatabase = new SupabaseAdapter();

export const getAllResults = async (context: Context) => {
  return Ok(context, await db.getAll(COLLECTION));
}

export const getOneResult = async (context: Context) => {
  const { id } = context.params

  const resultQuery = { id };

  const result = await db.getBy(COLLECTION, resultQuery);

  if (!result) return BadRequest(context, "Result do not exist");

  return Ok(context, result);
}

export const getResultsByContestId = async (context: Context) => {
  const { id } = context.params;
  const resultsQuery = { contest_id: id }

  const result = await db.getBy(COLLECTION, resultsQuery);

  if (!result) return BadRequest(context, "No results were found for this context")

  return Ok(context, result);
}

export const createResult = async (context: (Context & {
  body: typeof CreateResultSchema
})) => {
  const {
    contest_id,
    local_id,
    visitant_id,
    winner_id
  } = context.body

  if (local_id == visitant_id) return BadRequest(context, "Visitant and Local are the same.")

  return Created(context, await db.insert(COLLECTION, context.body))
}

export const updateResult = async (context: (Context & {
  body: typeof UpdateResultSchema
})) => {
  const { id } = context.params

  const resultQuery = {
    id: id
  }

  const toUpdt = await db.getBy(COLLECTION, resultQuery);

  if (!toUpdt) return BadRequest(context, "Result do not exist")

  return Ok(
    context,
    await db.update(COLLECTION, resultQuery, context.body)
  )
}

export const deleteResult = async (context: Context) => {
  const { id } = context.params

  const resultQuery = {
    id: id
  }

  const toDelete = await db.getBy(COLLECTION, resultQuery);

  if (!toDelete) return BadRequest(context, "This result do not exist");

  return Ok(context, await db.delete(COLLECTION, resultQuery))
}