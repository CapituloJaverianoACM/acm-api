import { Context } from "elysia";
import { BadRequest, Ok } from "../utils/responses";
import { IDatabase } from "../lib/database.interface";
import { MongoAdapter } from "../lib/mongo.adapter";

const COLLECTION: string = "members";
const db: IDatabase = new MongoAdapter();

export const getAllMembers = async (context: Context) => {
  const result = await db.getAll(COLLECTION);
  if (result.error) return BadRequest(context, "No members found.");
  return Ok(context, result.data);
};

export const getOneMember = async (context: Context) => {
  const result = await db.getBy(COLLECTION, {
    _id: parseInt(context.params.id),
  });

  if (result.error) return BadRequest(context, "This member do not exist.");

  return Ok(context, result.data);
};

export const createMember = async (context: Context) => {
  const member = await db.getBy(COLLECTION, {
    _id: context.body._id,
  });

  if (member.data) return BadRequest(context, "Member already exist.");

  const resultInsert = await db.insert(COLLECTION, context.body);
  if (resultInsert.error) return BadRequest(context, resultInsert.error);

  return Ok(context, resultInsert.data);
};

export const createManyMembers = async (context: Context) => {
  const members = await db.getAll(COLLECTION);

  if (members.error) return BadRequest(context, "No members found.");

  const newMembers = context.body.filter((member: any) => !members.data.some((m: any) => m._id === member._id));

  if (newMembers.length === 0) return BadRequest(context, "All members already exist.");

  const resultInsertMany = await db.insertMany(COLLECTION, newMembers);
  if (resultInsertMany.error) return BadRequest(context, resultInsertMany.error);

  return Ok(context, resultInsertMany.data);
};

export const updateMember = async (context: Context) => {
  const member = await db.getBy(COLLECTION, {
    _id: parseInt(context.params.id)
  });

  if (member.error) return BadRequest(context, "This member do not exist.");

  const result = await db.update(
    COLLECTION,
    { _id: parseInt(context.params.id) },
    context.body,
  );
  if (result.error) return BadRequest(context, result.error);

  return Ok(context, result.data);
};

export const deactivateMember = async (context: Context) => {
  const member = await db.getBy(COLLECTION, {
    _id: parseInt(context.params.id)
  });
  if (member.error) return BadRequest(context, "This member do not exist.");
  if (!member.data.active)
    return BadRequest(context, "This member is already deactivated.");

  member.data.active = false;
  const result = await db.update(
    COLLECTION,
    { _id: member.data._id },
    member.data
  );
  if (result.error) return BadRequest(context, result.error);

  return Ok(context, result.data);
};

export const deleteMember = async (context: Context) => {
  const member = await db.getBy(COLLECTION, {
    _id: parseInt(context.params.id)
  });
  if (member.error) return BadRequest(context, "This member do not exist");

  const result = await db.delete(
    COLLECTION,
    { _id: parseInt(context.params.id) }
  )
  if (result.error) return BadRequest(context, result.error);

  return Ok(context, result.data);
};
