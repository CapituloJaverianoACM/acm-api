import Elysia from "elysia";
import { createResult, deleteResult, getAllResults, getOneResult, getResultsByContestId, updateResult } from "./handlers";
import { CreateResultSchema, IdSupabaseInt4, UpdateResultSchema } from "../utils/entities";
import { verifyJWT } from "../utils/auth";


export const results = new Elysia({
  prefix: "/results"
})
  .state("user", {})
  .get("/", getAllResults)
  .get("/:id", getOneResult, {
    params: IdSupabaseInt4
  })
  .post("/create", createResult, {
    beforeHandle: verifyJWT,
    body: CreateResultSchema
  })
  .put("/:id", updateResult, {
    beforeHandle: verifyJWT,
    body: UpdateResultSchema,
    params: IdSupabaseInt4
  })
  .delete("/:id", deleteResult, {
    beforeHandle: verifyJWT,
    params: IdSupabaseInt4
  })
  .get('/contest/:id', getResultsByContestId, {
    params: IdSupabaseInt4
  })