import { Context } from "elysia";
import { BadRequest, Ok } from "../../utils/responses";
import { IDatabase } from "../../db/database.interface";
import { MongoAdapter } from "../../db/mongo/mongo.adapter";
import { ENTITY_FILTER_SCHEMAS, getEntityFilters } from "../../utils/filters";

const COLLECTION: string = "activities";
const db: IDatabase = new MongoAdapter();

export const getAllActivities = async (context: Context) => {
  const { filters, order, suborder, limit, offset } = getEntityFilters(context, COLLECTION as keyof typeof ENTITY_FILTER_SCHEMAS);

  // Si hay filtros, usar getBy, sino usar getAll
  const result = Object.keys(filters).length > 0
    ? await db.getBy(COLLECTION, filters, order, suborder, limit, offset)
    : await db.getAll(COLLECTION, order, suborder, limit, offset);

  if (result.error) return BadRequest(context, result.error);
  return Ok(context, result.data);
};

export const getOneActivity = async (context: Context) => {
  const result = await db.getBy(COLLECTION, {
    _id: context.params.id,
  });

  if (result.error) return BadRequest(context, "Do not exist.");

  return Ok(context, result.data);
};

export const createActivity = async (context: Context) => {
  const act = await db.getBy(COLLECTION, {
    title: context.body.title,
  });

  if (act.data) return BadRequest(context, "Activity already exist");

  const resultInsert = await db.insert(COLLECTION, context.body);
  if (resultInsert.error) return BadRequest(context, resultInsert.error);

  return Ok(context, resultInsert.data);
};

export const createManyActivities = async (context: Context) => {
  const resultInsertMany = await db.insertMany(COLLECTION, context.body);
  if (resultInsertMany.error)
    return BadRequest(context, resultInsertMany.error);

  return Ok(context, resultInsertMany.data);
};

export const updateActivity = async (context: Context) => {
  const activityId = context.params.id;

  const toUpdt = await db.getBy(COLLECTION, {
    _id: activityId,
  });

  if (toUpdt.error) return BadRequest(context, "This activity do not exist.");

  const resultUpdate = await db.update(
    COLLECTION,
    { _id: activityId },
    context.body,
  );
  if (resultUpdate.error) return BadRequest(context, resultUpdate.error);

  return Ok(context, resultUpdate.data);
};

export const deleteActivity = async (context: Context) => {
  const activityId = context.params.id;
  const toDel = await db.getBy(COLLECTION, {
    _id: activityId,
  });

  if (toDel.error) return BadRequest(context, "This activity do not exist.");

  const resultDelete = await db.delete(COLLECTION, {
    _id: activityId,
  });
  if (resultDelete.error) return BadRequest(context, resultDelete.error);

  return Ok(context, resultDelete.data);
};
