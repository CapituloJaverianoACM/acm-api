import { Context } from "elysia";
import { BadRequest, Ok } from "../utils/responses";
import { checkJWTExp, signJWT } from "../utils/auth";

export const loginHandler = (context: Context) => {
  const token = signJWT(context.store.user);
  return Ok(context, { token });
};

export const verifyHandler = (context: Context) => {
  const token = context.body.token;
  if (!checkJWTExp(token)) return BadRequest(context, "Token isn't valid");

  return Ok(context, "Token is good.");
};
