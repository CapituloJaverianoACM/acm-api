import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { IAuthProvider, RoleEnum } from "../auth.provider.interface";
import { StandardResponse } from "../../utils/responses";

export class SupabaseAuthProvider implements IAuthProvider {
    private client: SupabaseClient;
    private static instance: SupabaseAuthProvider | null;
    private USERS_TABLE: string = "student";

    private constructor() {
        this.client = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!,
        );
    }
    async login(
        email: string,
        password: string,
    ): Promise<StandardResponse<{ token: string }>> {
        const { error, data } = await this.client.auth.signInWithPassword({
            email,
            password,
        });
        if (error || !data.session.access_token)
            return { error: "Somehting happen with the auth.", data: null };

        return { error: null, data: { token: data.session.access_token } };
    }
    async register<T extends Object>(
        user: T,
        email: string,
        password: string,
        role: RoleEnum,
    ): Promise<StandardResponse<{ success: boolean }>> {
        if (role == RoleEnum.SUPER_ADMIN) {
            return { error: "Anyone can create a super admin", data: null };
        }

        const { data, error } = await this.client.auth.signUp({
            email,
            password,
        });

        if (error) {
            return { error, data: null };
        }

        (user as any)["role"] = role;

        const { error: err } = await this.client.from(this.USERS_TABLE).insert([
            {
                ...user,
                supabase_user_id: data.user?.id,
            },
        ]);

        if (err) return { error: err, data: null };

        return { error: null, data: { success: true } };
    }
    async validateToken(
        token: string,
    ): Promise<StandardResponse<{ user_id: string }>> {
        const { data, error } = await this.client.auth.getUser(token);
        if (error) return { error, data: null };

        return { error: null, data: { user_id: data.user.id } };
    }

    // @param id Must be Supabase user id
    async getUserFromAuthById(
        id: string,
    ): Promise<StandardResponse<{ id: number | string; role: RoleEnum }>> {
        const { data, error } = await this.client
            .from(this.USERS_TABLE)
            .select("id,role")
            .eq("supabase_user_id", id);

        if (error) return { error, data: null };
        if (data.length == 0) return { error: "There is no user.", data: null };

        return { error: null, data: data[0] };
    }

    async deleteUser(
        id: string,
    ): Promise<StandardResponse<{ success: boolean }>> {
        const { error } = await this.client.auth.admin.deleteUser(id);
        if (error) return { error, data: null };

        const result = await this.client
            .from(this.USERS_TABLE)
            .delete()
            .eq("supabase_user_id", id);
        if (result.error || result.count == 0)
            return { error: "We could not delete the user.", data: null };

        return { error: null, data: { success: true } };
    }

    public static getInstance(): SupabaseAuthProvider {
        if (!this.instance) this.instance = new SupabaseAuthProvider();
        return this.instance;
    }
}
