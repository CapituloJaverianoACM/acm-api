import { Context } from "elysia";
import { BadRequest, Created, Ok } from "../utils/responses";
import { IDatabase } from "../lib/database.interface";
import { SupabaseAdapter } from "../lib/supabase.adapter";

const COLLECTION: string = "contest";

const db: IDatabase = new SupabaseAdapter();

export const getAllContests = async (context: Context) => {
    const result = await db.getAll(COLLECTION);
    if (result.error) return BadRequest(context, result.error);

    return Ok(context, result.data);
};

export const getOneContest = async (context: Context) => {
    const result = await db.getBy(COLLECTION, {
        id: parseInt(context.params.id),
    });
    if (result.error) return BadRequest(context, result.error);

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
