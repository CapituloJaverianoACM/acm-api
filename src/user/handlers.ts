import { Context } from "elysia";
import { BadRequest, Ok, Unauthorized } from "../utils/responses";
import { IDatabase } from "../lib/database.interface";
import { MongoAdapter } from "../lib/mongo.adapter";
const bcrypt = require("bcryptjs");

const COLLECTION = "users";

const db: IDatabase = new MongoAdapter();

export const deleteUserHandler = async (context: Context) => {
    const { email } = context.params;

    if (!context.store.user.data.super)
        return Unauthorized(context, "Must be a super user");
    const user = await db.getBy(COLLECTION, { email });
    if (user.error) return BadRequest(context, "User do not exist");

    const resultDelete = await db.delete(COLLECTION, { email });
    if (resultDelete.error) return BadRequest(context, resultDelete.error);

    return Ok(context, resultDelete.data);
};

export const userPostHandler = async (context: Context) => {
    const user = context.store.user.data;
    const nUser = context.body;

    if (!user.super) return Unauthorized(context, "You must be a Super user.");

    const existingUser = await db.getBy(COLLECTION, {
        email: nUser.email,
    });
    if (existingUser.data) return BadRequest(context, "User already exist");

    const result = await db.insert(COLLECTION, {
        email: nUser.email,
        password: bcrypt.hashSync(nUser.password, 10),
    });
    if (result.error) return BadRequest(context, result.error);

    return Ok(context, result.data);
};
