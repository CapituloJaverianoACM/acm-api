import Elysia from "elysia";
import { verifyJWT } from "../../utils/auth";
import { CreateStudentSchema, UpdateStudentSchema } from "../../utils/entities";
import {
  getAllStudents,
  getOneStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} from "./handlers";

export const students = new Elysia({ prefix: "/students" })
  .state("user", {})
  .get("/", getAllStudents)
  .get("/:id", getOneStudent)
  .post("/create", createStudent, {
    beforeHandle: verifyJWT,
    body: CreateStudentSchema,
  })
  .put("/:id", updateStudent, {
    beforeHandle: verifyJWT,
    body: UpdateStudentSchema,
  })
  .delete("/:id", deleteStudent, {
    beforeHandle: verifyJWT,
  });
