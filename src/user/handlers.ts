import { Context } from "elysia";
import { BadRequest, Ok, Unauthorized } from "../utils/responses";
import MongoDB from "../lib/mongo";
const bcrypt = require('bcryptjs');
const mongo = new MongoDB();

const COLLECTION = 'users';

export const deleteUserHandler = async (context: Context) => {
    const { email } = context.params;

    if (!context.store.user.data.super) return Unauthorized(context, "Must be a super user");
    const user = await mongo.getOneDocument(COLLECTION, { email });
    if (!user) return BadRequest(context, "User do not exist");

    return (await mongo.deleteOneDocument(COLLECTION, { email }));
}


export const userPostHandler = async (context : Context) => {
    const user = context.store.user.data;
    const nUser = context.body;


    if (!user.super) return Unauthorized(context, "You must be a Super user.");


    const existingUser = await mongo.getOneDocument(COLLECTION, {email: nUser.email});

    if (existingUser != null) return BadRequest(context, "User already exist");

    const result = await mongo.insertDocument(COLLECTION, { email: nUser.email, password: (bcrypt.hashSync(nUser.password, 10)) });

    return Ok(context, result);
}
