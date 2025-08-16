import { Context } from "elysia";
import { BadRequest, Created, Ok } from "../utils/responses";
import { IDatabase } from "../lib/database.interface";
import { SupabaseAdapter } from "../lib/supabase.adapter";
import { CreateResultSchema, UpdateResultSchema } from "../utils/entities";

const COLLECTION: string = "results";

const db: IDatabase = new SupabaseAdapter();

export const getAllResults = async (context: Context) => {
  const result = await db.getAll(COLLECTION);
  if (result.error) return BadRequest(context, result.error);

  return Ok(context, result.data);
};

export const getOneResult = async (context: Context) => {
  const { id } = context.params;

  const resultQuery = { id };

  const result = await db.getBy(COLLECTION, resultQuery);

  if (result.error) return BadRequest(context, result.error);

  return Ok(context, result.data);
};

export const getResultsByContestId = async (context: Context) => {
  const { id } = context.params;
  const resultsQuery = { contest_id: id };

  const result = await db.getBy(COLLECTION, resultsQuery);

  if (result.error) return BadRequest(context, result.error);

  return Ok(context, result.data);
};

export const createResult = async (
  context: Context & {
    body: typeof CreateResultSchema;
  },
) => {
  const { local_id, visitant_id, winner_id } = context.body;

  if (local_id == visitant_id)
    return BadRequest(context, "Visitant and Local are the same.");
  if (winner_id != local_id && winner_id != visitant_id)
    return BadRequest(context, "Neither visitant or local is the winner");

  const result = await db.insert(COLLECTION, context.body);

  if (result.error) return BadRequest(context, result.error);

  return Created(context, result.data);
};

export const updateResult = async (
  context: Context & {
    body: typeof UpdateResultSchema;
  },
) => {
  const { id } = context.params;
  const { winner_id, local_id, visitant_id } = context.body;

  const resultQuery = {
    id: id,
  };

  const toUpdt = await db.getBy(COLLECTION, resultQuery);

  if (!toUpdt) return BadRequest(context, "Result do not exist");

  if (winner_id != local_id && winner_id != visitant_id)
    return BadRequest(context, "Neither visitant or local is the winner");

  const result = await db.update(COLLECTION, resultQuery, context.body);

  if (result.error) return BadRequest(context, result.error);

  return Ok(context, result.data);
};

export const deleteResult = async (context: Context) => {
  const { id } = context.params;

  const resultQuery = {
    id: id,
  };

  const toDelete = await db.getBy(COLLECTION, resultQuery);

  if (toDelete.error) return BadRequest(context, toDelete.error);

  const result = await db.delete(COLLECTION, resultQuery);

  if (result.error) return BadRequest(context, result.error);

  return Ok(context, result.data);
};
