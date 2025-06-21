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
