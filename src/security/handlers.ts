import { Context } from "elysia";
import { Ok } from "../utils/responses";
import { signJWT } from "../utils/auth";

export const loginHandler = (context: Context) => {
    const token = signJWT(context.store.user);
    return Ok(context, { token });
}
