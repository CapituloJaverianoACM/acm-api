import { t } from "elysia";
import { CreateStudentSchema } from "./student";

export const CreateAdminSchema = t.Composite([
    t.Pick(CreateStudentSchema, ["name", "surname"]),
    t.Object({ email: t.String({ format: "email" }), password: t.String() }),
]);
