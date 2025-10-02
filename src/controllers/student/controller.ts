import Elysia from "elysia";
import { verifyJWT } from "../../utils/auth";
import {
  CreateStudentSchema,
  UpdateStudentSchema,
  BulkIdQuery,
} from "../../utils/schemas/student";
import {
  getAllStudents,
  getOneStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsBulkId,
  getStudentBySupabase,
} from "./handlers";

export const students = new Elysia({ prefix: "/students" })
  .state("user", {})
  .get("/", getAllStudents)
  .get("/:id", getOneStudent)
  .get("/supabase/:id", getStudentBySupabase)
  .post("/create", createStudent, {
    beforeHandle: verifyJWT,
    body: CreateStudentSchema,
  })
  .post("/bulk-query/id", getStudentsBulkId, {
    body: BulkIdQuery,
  })
  .put("/:id", updateStudent, {
    beforeHandle: verifyJWT,
    body: UpdateStudentSchema,
  })
  .delete("/:id", deleteStudent, {
    beforeHandle: verifyJWT,
  });
