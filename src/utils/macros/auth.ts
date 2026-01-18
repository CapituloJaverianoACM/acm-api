import Elysia, { Context } from "elysia";
import { Unauthorized } from "../responses";
import { IAuthProvider } from "../../auth/auth.provider.interface";
import { SupabaseAuthProvider } from "../../auth/supabase/supabase.auth.adapter";
import { checkUsersMacro } from "./checkUser";

const auth_provider: IAuthProvider = SupabaseAuthProvider.getInstance();

const verifyJWTHandler = async (context: Context) => {
    const auth: string | null = context.request.headers.get("authorization");
    if (!auth) return Unauthorized(context, "No Bearer JWT");
    const [type, token] = auth.split(" ");

    if (type !== "Bearer") return Unauthorized(context, "Malformed Bearer token");

    const { error, data } = await auth_provider.validateToken(token);
    if (error || !data) return Unauthorized(context, "Token is invalid");

    const { user_id } = data;
    const { error: err, data: decoded } =
        await auth_provider.getUserFromAuthById(user_id);

    if (err || !decoded) return Unauthorized(context, "We do not have your user");

    (context.store as any).user = decoded;
};

export const jwtPlugin = new Elysia({ name: 'plugin' })
    .onBeforeHandle({ as: "scoped" }, verifyJWTHandler)
    .use(checkUsersMacro);
