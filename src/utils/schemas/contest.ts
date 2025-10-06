import { t } from "elysia";
export enum LevelEnum {
  Initial = "Initial",
  Advanced = "Advanced",
}

export const CreateContestSchema = t.Object({
  name: t.String(),
  date: t.Date(),
  start_hour: t.Date(),
  final_hour: t.Date(),
  level: t.Enum(LevelEnum),
  classroom: t.String(),
});

export const UpdateContestSchema = t.Object({
  name: t.Optional(t.String()),
  date: t.Optional(t.Date()),
  start_hour: t.Optional(t.Date()),
  final_hour: t.Optional(t.Date()),
  level: t.Optional(t.Enum(LevelEnum)),
  classroom: t.Optional(t.String()),
});
