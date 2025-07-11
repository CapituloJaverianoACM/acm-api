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
/*
    *
export interface Member {
    id: string;
    name: string;
    title: string;
    rol: string;
    email: string;
    bio: string;
    skills: string[];
    image?: string;
}
    *
    * */
export const CreateMemberSchema = t.Object({
  _id: t.Number(),
  name: t.String(),
  title: t.String(),
  role: t.String(),
  email: t.String(),
  bio: t.String(),
  skills: t.Array(t.String(), { minItems: 1 }),
  image: t.Optional(t.String()),
  active: t.Boolean(),
  linkedin: t.Optional(t.String()),
  github: t.Optional(t.String()),
  memberSince: t.String()
});

export const UpdateMemberSchema = t.Object({
  _id: t.Optional(t.Number()),
  name: t.Optional(t.String()),
  title: t.Optional(t.String()),
  role: t.Optional(t.String()),
  email: t.Optional(t.String()),
  bio: t.Optional(t.String()),
  skills: t.Optional(t.Array(t.String(), { minItems: 1 })),
  image: t.Optional(t.String()),
  active: t.Optional(t.Boolean()),
  linkedin: t.Optional(t.String()),
  github: t.Optional(t.String()),
  memberSince: t.Optional(t.String())
});
