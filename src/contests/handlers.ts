import { Context } from "elysia";
import MongoDB from "../lib/mongo";
import { BadRequest, Created, Ok } from "../utils/responses";
import { ObjectId } from "mongodb";

const COLLECTION: string = "contests";
const mongo = MongoDB.getInstance();

export const getAllContests = async (context: Context) => {
  return Ok(context, await mongo.getAllDocuments(COLLECTION));
};

export const getOneContest = async (context: Context) => {

  const contestQuery = { _id: new ObjectId(context.params.id) };
  
  const result = await mongo.getOneDocument(COLLECTION, contestQuery);
  if (!result) return BadRequest(context, "Contest do not exist");

  return Ok(context, result);
};

export const createContest = async (context: Context) => {

  const contestQuery = {
      name: context.body.name
  }
  const result = await mongo.getOneDocument(COLLECTION, contestQuery);

  if (result) return BadRequest(context, "Contest name already exists.");

  return Created(context, await mongo.insertDocument(COLLECTION, context.body));
};

export const updateContest = async (context: Context) => {
  const contestId = context.params.id;
  const contestQuery = { _id: new ObjectId(contestId) };

  const toUpdt = await mongo.getOneDocument(COLLECTION, contestQuery);

  if (!toUpdt) return BadRequest(context, "Contest do not exist");

  return Ok(
    context,
    await mongo.updateOneDocument(COLLECTION, contestQuery, context.body),
  );
};

export const deleteContest = async (context: Context) => {
  const contestQuery = { _id: new ObjectId(context.params.id) };

  const toDelete = await mongo.getOneDocument(COLLECTION, contestQuery);

  if (!toDelete) return BadRequest(context, "This contest do not exist");

  return Ok(context, await mongo.deleteOneDocument(COLLECTION, contestQuery));
};
