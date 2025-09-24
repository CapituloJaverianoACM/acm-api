import { t } from "elysia";

export const CreateParticipationSchema = t.Object({
  contest_id: t.Number(),
  student_id: t.Number(),
  position: t.Optional(t.Nullable(t.Number())),
  checkin: t.Boolean(),
});

export const UpdateParticipationSchema = t.Object({
  position: t.Optional(t.Number()),
  checkin: t.Optional(t.Boolean()),
});
