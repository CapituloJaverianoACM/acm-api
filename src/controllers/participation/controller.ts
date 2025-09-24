import Elysia, { t } from "elysia";
import { verifyJWT } from "../../utils/auth";
import {
  CreateParticipationSchema,
  UpdateParticipationSchema,
} from "../../utils/schemas/participation";

import { IdSupabaseInt4, NumericString } from "../../utils/schemas/lib";

import {
  createParticipation,
  deleteParticipation,
  getAllParticipations,
  getOneParticipation,
  updateParticipation,
  getParticipationsByContestId,
  getParticipationsByStudentId,
} from "./handlers";

export const participation = new Elysia({ prefix: "/participation" })
  .state("user", {})
  .get("/", getAllParticipations)
  .get("/contest/:contest_id", getParticipationsByContestId, {
    params: t.Object({
      contest_id: NumericString,
    }),
  })
  .get("/student/:student_id", getParticipationsByStudentId, {
    params: t.Object({
      student_id: NumericString,
    }),
  })
  .get("/:contest_id/:student_id", getOneParticipation, {
    params: t.Object({
      contest_id: NumericString,
      student_id: NumericString,
    }),
  })

  .post("/create", createParticipation, {
    beforeHandle: verifyJWT,
    body: CreateParticipationSchema,
  })
  .put("/:contest_id/:student_id", updateParticipation, {
    beforeHandle: verifyJWT,
    body: UpdateParticipationSchema,
  })
  .delete("/:contest_id/:student_id", deleteParticipation, {
    beforeHandle: verifyJWT,
  });
