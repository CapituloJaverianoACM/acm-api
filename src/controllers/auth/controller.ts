import Elysia, { t } from "elysia";
import { AuthService } from "../../services/AuthService";
import { SupabaseAuthProvider } from "../../auth/supabase/supabase.auth.adapter";
import { BadRequest, Ok } from "../../utils/responses";

const authService = new AuthService(SupabaseAuthProvider.getInstance());

export const auth = new Elysia({ prefix: "/auth" })
  .get("login", async (context) => {
    const auth: string | null = context.request.headers.get("authorization");
    if (!auth || auth.split(" ")[0] != "Basic") {
      return BadRequest(
        context,
        "Auth header do not exist or malformed Basic auth header",
      );
    }

    const token = auth.split(" ")[1];
    const [user, password] = Buffer.from(token, "base64")
      .toString("binary")
      .split(":");

    const result = await authService.login(user, password);
    if (result.error) return BadRequest(context, result.error);
    return Ok(context, result.data);
  })
  .post(
    "verify",
    async (context) => {
      const token = (context.body as any).token;
      const result = await authService.validateToken(token);

      if (result.error) {
        console.log(result.error);
        return BadRequest(context, result.error);
      }

      return Ok(context, result.data);
    },
    {
      body: t.Object({
        token: t.String(),
      }),
    },
  );
