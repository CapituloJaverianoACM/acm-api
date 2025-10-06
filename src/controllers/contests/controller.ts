import Elysia from "elysia";
import { verifyJWT } from "../../utils/auth";
import {
  CreateContestSchema,
  UpdateContestSchema,
} from "../../utils/schemas/contest";
import {
  createContest,
  deleteContest,
  getAllContests,
  getContestsBulkId,
  getOneContest,
  updateContest,
} from "./handlers";
import { BulkIdQuery } from "../../utils/schemas/student";

export const contests = new Elysia({ prefix: "/contests" })
  .state("user", {})
  .get("/", getAllContests)
  .get("/:id", getOneContest)
  .post("/create", createContest, {
    beforeHandle: verifyJWT,
    body: CreateContestSchema,
  })
  .post("/bulk-query/id", getContestsBulkId, {
    body: BulkIdQuery,
  })
  .put("/:id", updateContest, {
    beforeHandle: verifyJWT,
    body: UpdateContestSchema,
  })
  .delete("/:id", deleteContest, {
    beforeHandle: verifyJWT,
  });
