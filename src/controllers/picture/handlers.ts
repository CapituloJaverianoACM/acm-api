import { Context } from "elysia";
import { BadRequest, Created, Ok } from "../../utils/responses";
import { IDatabase } from "../../db/database.interface";
import { SupabaseAdapter } from "../../db/supabase/supabase.adapter";
import { ENTITY_FILTER_SCHEMAS, getEntityFilters } from "../../utils/filters";

const COLLECTION: string = "picture";

const db: IDatabase = new SupabaseAdapter();

export const getAllPictures = async (context: Context) => {
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

export const getOnePicture = async (context: Context) => {
  const result = await db.getBy(COLLECTION, {
    id: parseInt(context.params.id),
  });
  if (result.error) return BadRequest(context, result.error);

  return Ok(context, result.data);
};

export const createPicture = async (context: Context) => {
  const insertResult = await db.insert(COLLECTION, context.body);
  if (insertResult.error) return BadRequest(context, insertResult.error);

  return Created(context, insertResult.data);
};

export const updatePicture = async (context: Context) => {
  const pictureQuery = { id: parseInt(context.params.id) };

  const toUpdt = await db.getBy(COLLECTION, pictureQuery);
  if (toUpdt.error) return BadRequest(context, toUpdt.error);

  const updateResult = await db.update(COLLECTION, pictureQuery, context.body);
  if (updateResult.error) return BadRequest(context, updateResult.error);

  return Ok(context, updateResult.data);
};

export const deletePicture = async (context: Context) => {
  const pictureQuery = { id: parseInt(context.params.id) };

  const toDelete = await db.getBy(COLLECTION, pictureQuery);
  if (toDelete.error) return BadRequest(context, toDelete.error);

  const deleteResult = await db.delete(COLLECTION, pictureQuery);
  if (deleteResult.error) return BadRequest(context, deleteResult.error);

  return Ok(context, deleteResult.data);
};
