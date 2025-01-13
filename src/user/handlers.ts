import { Context } from "elysia";
import { BadRequest, Ok } from "../utils/responses";
import MongoDB from "../lib/mongo";
const bcrypt = require('bcrypt');
const dbg = require('debug');

const debug = dbg('user:handlers')

export const userPostHandler = async (context : Context) => {
    const user = context.store.user.data;
    const nUser = context.body;


    if (!user.super) return BadRequest(context, "You must be a Super user.");

    const mongo = new MongoDB();
    const result = await mongo.insertDocument('users', { email: nUser.email, password: (bcrypt.hashSync(nUser.password, 10)) });

    return Ok(context, result);
}
