import { t } from "elysia";

export const ContestTreeNodeSchema = t.Recursive((Self) =>
  t.Object({
    id_participant: t.Number(),
    parent: t.Optional(Self),
    left: t.Optional(Self),
    right: t.Optional(Self),
  })
);
