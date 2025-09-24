import { Context } from "elysia";
import { BadRequest, Created, Ok } from "../../utils/responses";
import { IDatabase } from "../../db/database.interface";
import { SupabaseAdapter } from "../../db/supabase/supabase.adapter";
import { ENTITY_FILTER_SCHEMAS, getEntityFilters } from "../../utils/filters";

const COLLECTION: string = "contest";
const PICTURES_COLLECTION: string = "picture";

const db: IDatabase = new SupabaseAdapter();

const addPictures = async (result: {
  error: string | null;
  data: any;
}): Promise<{
  error: string | null;
  data: any;
}> => {
  result.data = await Promise.all(
    result.data.map(async (x: any) => {
      const pictureResult = await db.getBy(PICTURES_COLLECTION, {
        contest_id: x.id,
      });

      if (pictureResult.error || pictureResult.data.length == 0) return x;

      return {
        ...x,
        picture: pictureResult.data?.at(0), // Solo debería haber una
      };
    }),
  );

  return result;
};

export const getAllContests = async (context: Context) => {
  const wPicture =
    new URL(context.request.url).searchParams.get("picture") == "1";

  const { filters, order, suborder, limit, offset } = getEntityFilters(
    context,
    COLLECTION as keyof typeof ENTITY_FILTER_SCHEMAS,
  );

  // Si hay filtros, usar getBy, sino usar getAll
  let result =
    Object.keys(filters).length > 0
      ? await db.getBy(COLLECTION, filters, order, suborder, limit, offset)
      : await db.getAll(COLLECTION, order, suborder, limit, offset);

  if (result.error) return BadRequest(context, result.error);

  if (wPicture) result = await addPictures(result);

  return Ok(context, result.data);
};

export const getOneContest = async (context: Context) => {
  const wPicture =
    new URL(context.request.url).searchParams.get("picture") == "1";

  let result = await db.getBy(COLLECTION, {
    id: parseInt(context.params.id),
  });
  if (result.error) return BadRequest(context, result.error);

  if (wPicture) result = await addPictures(result);

  return Ok(context, result.data);
};

export const createContest = async (context: Context) => {
  const contestQuery = {
    name: context.body.name,
  };

  const result = await db.getBy(COLLECTION, contestQuery);
  if (result.data && result.data.length > 0)
    return BadRequest(context, "Contest name already exists.");

  const insertResult = await db.insert(COLLECTION, context.body);
  if (insertResult.error) return BadRequest(context, insertResult.error);

  return Created(context, insertResult.data);
};

export const updateContest = async (context: Context) => {
  const contestQuery = { id: parseInt(context.params.id) };

  const toUpdt = await db.getBy(COLLECTION, contestQuery);
  if (toUpdt.error) return BadRequest(context, toUpdt.error);

  const updateResult = await db.update(COLLECTION, contestQuery, context.body);
  if (updateResult.error) return BadRequest(context, updateResult.error);

  return Ok(context, updateResult.data);
};

export const deleteContest = async (context: Context) => {
  const contestQuery = { id: parseInt(context.params.id) };

  const toDelete = await db.getBy(COLLECTION, contestQuery);
  if (toDelete.error) return BadRequest(context, toDelete.error);

  const deleteResult = await db.delete(COLLECTION, contestQuery);
  if (deleteResult.error) return BadRequest(context, deleteResult.error);

  return Ok(context, deleteResult.data);
};
