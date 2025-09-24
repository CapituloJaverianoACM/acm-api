import Elysia, { t } from "elysia";
import { verifyJWT } from "../../utils/auth";
import {
    CreateParticipationSchema,
    IdSupabaseInt4,
    UpdateParticipationSchema,
} from "../../utils/entities";
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
    .get("/contest/:contest_id", getParticipationsByContestId, 
        { params: t.Object({
            contest_id: t.Number()
        }) })
    .get("/student/:student_id", getParticipationsByStudentId, 
        { params: t.Object({
            student_id: t.Number()
        }) })
    .get("/:contest_id/:student_id", getOneParticipation, {
        params: t.Object({
            contest_id: t.Number(),
            student_id: t.Number()
        })
    })

    .post("/create", createParticipation, {
        beforeHandle: [verifyJWT],
        body: CreateParticipationSchema,
    })
    .put("/:contest_id/:student_id", updateParticipation, {
        beforeHandle: verifyJWT,
        body: UpdateParticipationSchema,

    })
    .delete("/:contest_id/:student_id", deleteParticipation, {
        beforeHandle: verifyJWT,
    });