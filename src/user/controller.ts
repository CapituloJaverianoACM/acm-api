import { Elysia, t } from "elysia";
import { deleteUserHandler, userPostHandler } from "./handlers";
import { verifyJWT } from "../utils/auth";

export const user = new Elysia({ prefix: "/users" })
  .state("user", {})
  .post("/create", userPostHandler, {
    beforeHandle: verifyJWT,
    body: t.Object({
      email: t.String(),
      password: t.String(),
    }),
  })
  .delete("/:email", deleteUserHandler, {
    beforeHandle: verifyJWT,
  });
