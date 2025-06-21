import { Context } from "elysia";

export const sendResponse = (
  c: Context,
  data: any,
  error: any,
  status: number,
) => {
  c.set.status = status;
  return {
    error,
    data,
  };
};

export const BadRequest = (c: Context, error: any) =>
  sendResponse(c, null, error, 400);

export const Ok = (c: Context, data: any) => sendResponse(c, data, null, 200);

export const Unauthorized = (c: Context, msg: string) =>
  sendResponse(c, null, msg, 401);
