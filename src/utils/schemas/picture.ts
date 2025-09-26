import { t } from "elysia";

export const CreatePictureSchema = t.Object({
  link: t.String(),
  contest_id: t.Number(),
});

export const UpdatePictureSchema = t.Object({
  link: t.Optional(t.String()),
  contest_id: t.Optional(t.Number()),
});
