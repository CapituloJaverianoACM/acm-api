import { t } from "elysia";
import { LevelEnum } from "./contest";

export const CreateStudentSchema = t.Object({
  name: t.String(),
  surname: t.String(),
  matches_count: t.Number(),
  victory_count: t.Number(),
  level: t.Enum(LevelEnum),
});

export const UpdateStudentSchema = t.Object({
  name: t.Optional(t.String()),
  surname: t.Optional(t.String()),
  matches_count: t.Optional(t.Number()),
  victory_count: t.Optional(t.Number()),
  level: t.Optional(t.Enum(LevelEnum)),
});

export const BulkIdQuery = t.Object({
  ids: t.Array(t.Number()),
});
