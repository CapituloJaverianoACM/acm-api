import { t } from "elysia";

export const NumericString = t.String({
  pattern: "^[0-9]+$",
  default: "",
  description: "Supabase ID must be numeric",
});

export const IdSupabaseInt4 = t.Object({
  id: NumericString,
});

export const IdMongoParamSchema = t.Object({
  id: t.RegExp(/[0-9A-Fa-f]{24}/),
});
