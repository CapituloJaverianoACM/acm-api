import { Elysia } from "elysia";
import { UserService } from "../../services/UserService";
import { BadRequest, Ok } from "../../utils/responses";
import { jwtPlugin } from "../../utils/macros/auth";
import { SupabaseAuthProvider } from "../../auth/supabase/supabase.auth.adapter";
import { CreateAdminSchema } from "../../utils/schemas/admins";
import { IdSupabaseInt4 } from "../../utils/schemas/lib";

const userService = new UserService(SupabaseAuthProvider.getInstance());

export const admins = new Elysia({ prefix: "/admins" })
    .use(jwtPlugin)
    .post(
        "/create",
        async (context) => {
            const nUser = context.body;
            const result = await userService.create(nUser);
            if (result.error) return BadRequest(context, result.error);

            return Ok(context, result.data);
        },
        {
            body: CreateAdminSchema,
            isSuperAdmin: true,
        },
    )
    .delete(
        "/:id",
        async (context) => {
            const { id } = context.params;

            const result = await userService.delete(parseInt(id));
            if (result.error) return BadRequest(context, result.error);

            return Ok(context, result.data);
        },
        { params: IdSupabaseInt4, isSuperAdmin: true },
    );
