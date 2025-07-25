import Elysia from "elysia";
import { verifyJWT } from "../utils/auth";
import { CreateContestSchema, IdMongoParamSchema, UpdateContestSchema } from "../utils/entities";
import {
  createContest,
  deleteContest,
  getAllContests,
  getOneContest,
  updateContest,
} from "./handlers";

export const contests = new Elysia({ prefix: "/contests" })
  .state("user", {})
  .get("/", getAllContests)
  .get("/:id", getOneContest)
  .post("/create", createContest, {
    beforeHandle: verifyJWT,
    body: CreateContestSchema,
  })
  .put("/:id", updateContest, {
    beforeHandle: verifyJWT,
    body: UpdateContestSchema,
  })
  .delete("/:id", deleteContest, {
    beforeHandle: verifyJWT,
  });
