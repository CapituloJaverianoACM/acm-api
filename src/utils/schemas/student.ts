import { Static, t } from "elysia";
import { LevelEnum } from "./contest";
import { RoleEnum } from "../../auth/auth.provider.interface";

export const CreateStudentSchema = t.Object({
    name: t.String(),
    surname: t.String(),
    matches_count: t.Number(),
    victory_count: t.Number(),
    level: t.Enum(LevelEnum),
    avatar: t.String(),
});

export const UpdateStudentSchema = t.Object({
    name: t.Optional(t.String()),
    surname: t.Optional(t.String()),
    matches_count: t.Optional(t.Number()),
    victory_count: t.Optional(t.Number()),
    level: t.Optional(t.Enum(LevelEnum)),
    avatar: t.Optional(t.String()),
    codeforces_handle: t.Optional(t.String()),
    role: t.Optional(t.Enum(RoleEnum)),
});

export type Student = Static<typeof UpdateStudentSchema>;

export const BulkIdQuery = t.Object({
    ids: t.Array(t.Number()),
});
