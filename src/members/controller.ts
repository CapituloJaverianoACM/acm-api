import Elysia, { t } from "elysia";
import { verifyJWT } from "../utils/auth";
import {
  createMember,
  createManyMembers,
  deactivateMember,
  deleteMember,
  getAllMembers,
  getOneMember,
  updateMember,
} from "./handlers";
import { CreateMemberSchema, UpdateMemberSchema } from "../utils/entities";

export const members = new Elysia({ prefix: "/members" })
  .state("user", {})
  .get("/", getAllMembers)
  .get("/:id", getOneMember)
  .post("/create", createMember, {
    beforeHandle: verifyJWT,
    body: CreateMemberSchema,
  })
  .post("/createMany", createManyMembers, {
    beforeHandle: verifyJWT,
    body: t.Array(CreateMemberSchema),
  })
  .post("/deactivate/:id", deactivateMember, {
    beforeHandle: verifyJWT,
  })
  .put("/:id", updateMember, {
    beforeHandle: verifyJWT,
    body: UpdateMemberSchema,
  })
  .delete("/:id", deleteMember, {
    beforeHandle: verifyJWT
  });
