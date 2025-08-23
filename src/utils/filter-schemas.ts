import { t } from "elysia";
import { LevelEnum } from "./entities";

const FilterBaseSchema = {
  limit: t.Optional(t.Number()),
  offset: t.Optional(t.Number()),
  ordercol: t.Optional(t.String()),
  subordercol: t.Optional(t.String()),
  asc: t.Optional(t.Boolean()),
  subasc: t.Optional(t.Boolean()),
};

const createFilterSchema = (additionalFields: Record<string, any>) => t.Object({
  ...FilterBaseSchema,
  ...additionalFields,
});

export const StudentFilterSchema = createFilterSchema({
  name: t.Optional(t.String()),
  surname: t.Optional(t.String()),
  matches_count: t.Optional(t.Number()),
  victory_count: t.Optional(t.Number()),
  level: t.Optional(t.Enum(LevelEnum)),
});

export const MemberFilterSchema = createFilterSchema({
  name: t.Optional(t.String()),
  title: t.Optional(t.String()),
  role: t.Optional(t.String()),
  email: t.Optional(t.String()),
  active: t.Optional(t.Boolean()),
  memberSince: t.Optional(t.String()),
});

export const ContestFilterSchema = createFilterSchema({
  name: t.Optional(t.String()),
  date: t.Optional(t.String()),
  level: t.Optional(t.Enum(LevelEnum)),
  classroom: t.Optional(t.String()),
});

export const ActivityFilterSchema = createFilterSchema({
  title: t.Optional(t.String()),
  eventType: t.Optional(t.String()),
  speaker: t.Optional(t.String()),
  timestamp: t.Optional(t.String()),
});

export const PictureFilterSchema = createFilterSchema({
  contest_id: t.Optional(t.Number()),
});

export const ResultFilterSchema = createFilterSchema({
  contest_id: t.Optional(t.Number()),
  winner_id: t.Optional(t.Number()),
  local_id: t.Optional(t.Number()),
  visitant_id: t.Optional(t.Number()),
});

export const ParticipationFilterSchema = createFilterSchema({
  contest_id: t.Optional(t.Number()),
  student_id: t.Optional(t.Number()),
  position: t.Optional(t.Number()),
  checkin: t.Optional(t.Boolean()),
});
