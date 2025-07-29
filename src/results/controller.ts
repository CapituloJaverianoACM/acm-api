import Elysia from "elysia";
import { createResult, deleteResult, getAllResults, updateResult } from "./handlers";
import { getOneContest } from "../contests/handlers";
import { CreateResultSchema, IdMongoParamSchema, UpdateResultSchema } from "../utils/entities";
import { verifyJWT } from "../utils/auth";


export const results = new Elysia({
  prefix: "/results"
})
  .state("user", {})
  .get("/", getAllResults)
  .get("/:id", getOneContest, {
    params: IdMongoParamSchema
  })
  .post("/create", createResult, {
    beforeHandle: verifyJWT,
    body: CreateResultSchema
  })
  .put("/:id", updateResult, {
    beforeHandle: verifyJWT,
    body: UpdateResultSchema,
    paraks: IdMongoParamSchema
  })
  .delete("/:id", deleteResult, {
    beforeHandle: verifyJWT,
    params: IdMongoParamSchema
  })
  // .get('/contest/:id', getResultsByContestId, {
  //   params: IdMongoParamSchema
  // })