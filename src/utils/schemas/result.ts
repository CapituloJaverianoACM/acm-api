import { Static, t } from "elysia";

export const CreateResultSchema = t.Object({
  contest_id: t.Number(),
  winner_id: t.Number(),
  local_id: t.Number(),
  visitant_id: t.Number(),
});

export const UpdateResultSchema = t.Object({
  contest_id: t.Optional(t.Number()),
  winner_id: t.Optional(t.Number()),
  local_id: t.Optional(t.Number()),
  visitant_id: t.Optional(t.Number()),
});

export type Result = Static<typeof CreateResultSchema> & { id: number };