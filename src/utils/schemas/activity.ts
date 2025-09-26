import { t } from "elysia";
export const ActivitySchema = t.Object({
  title: t.String(),
  description: t.String(),
  eventType: t.String(),
  link: t.Optional(t.String()),
  location: t.Optional(t.String()),
  duration: t.String(),
  speaker: t.String(),
  timestamp: t.String(),
});

export const UpdateActivitySchema = t.Object({
  title: t.Optional(t.String()),
  description: t.Optional(t.String()),
  eventType: t.Optional(t.String()),
  link: t.Optional(t.String()),
  location: t.Optional(t.String()),
  duration: t.Optional(t.String()),
  speaker: t.Optional(t.String()),
  timestamp: t.Optional(t.String()),
});
