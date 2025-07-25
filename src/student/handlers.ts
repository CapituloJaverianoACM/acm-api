import { Context } from "elysia";
import MongoDB from "../lib/mongo";
import { BadRequest, Ok } from "../utils/responses";

const COLLECTION: string = "students";
const mongo = MongoDB.getInstance();

export const getAllStudents = async (context: Context) => {
  const result = await mongo.getAllDocuments(COLLECTION);
  return Ok(context, result);
};

export const getOneStudent = async (context: Context) => {
  const result = await mongo.getOneDocument(COLLECTION, {
    _id: parseInt(context.params.id),
  });

  if (!result) return BadRequest(context, "This student do not exist.");

  return Ok(context, result);
};

export const createStudent = async (context: Context) => {
  const member = await mongo.getOneDocument(COLLECTION, {
    _id: context.body._id,
  });

  if (member) return BadRequest(context, "Student already exist.");
  return Ok(context, await mongo.insertDocument(COLLECTION, context.body));
};


export const updateStudent = async (context: Context) => {
  const member = await mongo.getOneDocument(COLLECTION, {
    _id: parseInt(context.params.id)
  });

  if (!member) return BadRequest(context, "This student do not exist.");

  const result = await mongo.updateOneDocument(
    COLLECTION,
    { _id: parseInt(context.params.id) },
    context.body,
  );

  return Ok(context, result);
};

export const deleteStudent = async (context: Context) => {
  const member = await mongo.getOneDocument(COLLECTION, {
    _id: parseInt(context.params.id)
  });
  if (!member) return BadRequest(context, "This student do not exist");

  const result = await mongo.deleteOneDocument(
    COLLECTION,
    { _id: parseInt(context.params.id) }
  )

  return Ok(context, result);
};
