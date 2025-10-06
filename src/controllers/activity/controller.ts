import Elysia, { t } from "elysia";
import { verifyJWT } from "../../utils/auth";
import {
  ActivitySchema,
  UpdateActivitySchema,
} from "../../utils/schemas/activity";
import {
  createActivity,
  createManyActivities,
  deleteActivity,
  getAllActivities,
  getOneActivity,
  updateActivity,
} from "./handlers";

export const activity = new Elysia({ prefix: "/activity" })
  .state("user", {})
  .get("/", getAllActivities)
  .get("/:id", getOneActivity)
  .post("/create", createActivity, {
    beforeHandle: verifyJWT,
    body: ActivitySchema,
  })
  .post("/createMany", createManyActivities, {
    beforeHandle: verifyJWT,
    body: t.Array(ActivitySchema),
  })
  .put("/:id", updateActivity, {
    beforeHandle: verifyJWT,
    body: UpdateActivitySchema,
  })
  .delete("/:id", deleteActivity, {
    beforeHandle: verifyJWT,
  });
