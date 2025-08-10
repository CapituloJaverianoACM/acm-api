import Elysia from "elysia";
import { verifyJWT } from "../utils/auth";
import {
    CreateParticipationSchema,
    UpdateParticipationSchema,
} from "../utils/entities";
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
    .get("/contest/:contest_id", getParticipationsByContestId)
    .get("/student/:student_id", getParticipationsByStudentId)
    .get("/:contest_id/:student_id", getOneParticipation)
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