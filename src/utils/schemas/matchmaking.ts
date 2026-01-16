import { t } from "elysia";
import { NumericString } from "./lib";

export const CreateMatchmakingSchema = t.Object({
    contest_id: t.Number(),
});

export const ContestIdParamSchema = t.Object({
    contest_id: NumericString
});
