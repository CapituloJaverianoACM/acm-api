import { Context } from "elysia";
const dbg = require('debug');

const debug = dbg('user:handlers')

export const userPostHandler = (context : Context) => {
    debug(context.headers)
}
