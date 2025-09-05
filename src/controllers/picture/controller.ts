import Elysia from "elysia";
import { verifyJWT } from "../../utils/auth";
import { CreatePictureSchema, UpdatePictureSchema } from "../../utils/entities";
import {
  createPicture,
  deletePicture,
  getAllPictures,
  getOnePicture,
  updatePicture,
} from "./handlers";

export const pictures = new Elysia({ prefix: "/pictures" })
  .state("user", {})
  .get("/", getAllPictures)
  .get("/:id", getOnePicture)
  .post("/create", createPicture, {
    beforeHandle: verifyJWT,
    body: CreatePictureSchema,
  })
  .put("/:id", updatePicture, {
    beforeHandle: verifyJWT,
    body: UpdatePictureSchema,
  })
  .delete("/:id", deletePicture, {
    beforeHandle: verifyJWT,
  });
