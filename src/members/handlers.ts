import { Context } from "elysia";
import MongoDB from "../lib/mongo";
import { BadRequest, Ok } from "../utils/responses";

const COLLECTION: string = "members";
const mongo = MongoDB.getInstance();

export const getAllMembers = async (context: Context) => {
  const result = await mongo.getAllDocuments(COLLECTION);
  return Ok(context, result);
};

export const getOneMember = async (context: Context) => {
  const result = await mongo.getOneDocument(COLLECTION, {
    _id: parseInt(context.params.id),
  });

  if (!result) return BadRequest(context, "This member do not exist.");

  return Ok(context, result);
};

export const createMember = async (context: Context) => {
  const member = await mongo.getOneDocument(COLLECTION, {
    _id: context.body._id,
  });

  if (member) return BadRequest(context, "Member already exist.");
  return Ok(context, await mongo.insertDocument(COLLECTION, context.body));
};

export const createManyMembers = async (context: Context) => {
  const members = await mongo.getAllDocuments(COLLECTION);
  const newMembers = context.body.filter((member: any) => !members.some((m: any) => m._id === member._id));

  if (newMembers.length === 0) return BadRequest(context, "All members already exist.");

  return Ok(context, await mongo.insertManyDocuments(COLLECTION, newMembers));
};

export const updateMember = async (context: Context) => {
  const member = await mongo.getOneDocument(COLLECTION, {
    _id: parseInt(context.params.id)
  });

  if (!member) return BadRequest(context, "This member do not exist.");

  const result = await mongo.updateOneDocument(
    COLLECTION,
    { _id: parseInt(context.params.id) },
    context.body,
  );

  return Ok(context, result);
};

export const deactivateMember = async (context: Context) => {
  const member = await mongo.getOneDocument(COLLECTION, {
    _id: parseInt(context.params.id)
  });
  if (!member) return BadRequest(context, "This member do not exist.");
  if (!member.active)
    return BadRequest(context, "This member is already deactivated.");

  member.active = false;
  const result = await mongo.updateOneDocument(
    COLLECTION,
    { _id: member._id },
    member,
  );

  return Ok(context, result);
};

export const deleteMember = async (context: Context) => {
  const member = await mongo.getOneDocument(COLLECTION, {
    _id: parseInt(context.params.id)
  });
  if (!member) return BadRequest(context, "This member do not exist");

  const result = await mongo.deleteOneDocument(
    COLLECTION,
    { _id: parseInt(context.params.id) }
  )

  return Ok(context, result);
};
