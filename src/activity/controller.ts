import Elysia from "elysia";
import { verifyJWT } from "../utils/auth";
import { ActivitySchema, UpdateActivitySchema } from "../utils/entities";
import { createActivity, deleteActivity, getAllActivities, getOneActivity, updateActivity } from "./handlers";

export const activity = new Elysia({ prefix: '/activity' })
    .state('user', {})
    .get('/', getAllActivities)
    .get('/:id', getOneActivity)
    .post('/create', createActivity ,{
        beforeHandle: verifyJWT,
        body: ActivitySchema
    })
    .put('/:id', updateActivity, {
        beforeHandle: verifyJWT,
        body: UpdateActivitySchema
    })
    .delete('/:id', deleteActivity, {
        beforeHandle: verifyJWT
    });
