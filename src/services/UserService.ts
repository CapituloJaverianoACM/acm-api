import { IAuthProvider, RoleEnum } from "../auth/auth.provider.interface";
import { SupabaseAdapter } from "../db/supabase/supabase.adapter";
import { LevelEnum } from "../utils/schemas/contest";
import { StudentService } from "./StudentService";

export class UserService {
    private student_servive = new StudentService(new SupabaseAdapter());

    constructor(private auth_provider: IAuthProvider) { }

    async create(userData: {
        email: string;
        password: string;
        name: string;
        surname: string;
    }): Promise<{
        error: string | null;
        data: any;
    }> {
        const { email, password, name, surname } = userData;
        const user = {
            name,
            surname,
            level: LevelEnum.Advanced,
        };

        const { error, data } = await this.auth_provider.register(
            user,
            email,
            password,
            RoleEnum.ADMIN,
        );
        if (error) return { error, data: null };

        return { error: null, data };
    }

    async delete(id: number): Promise<{ error: string | null; data: any }> {
        const result = await this.student_servive.getOne(id);
        if (result.error) return { error: result.error, data: null };

        if (result.data[0].role != "admin")
            return {
                error: "This is the wrong endpoint to delete a user.",
                data: null,
            };

        return await this.auth_provider.deleteUser(result.data[0].supabase_user_id);
    }
}
