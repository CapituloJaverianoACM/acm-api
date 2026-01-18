import { StandardResponse } from "../utils/responses";

export enum RoleEnum {
    USER = "user",
    ADMIN = "admin",
    SUPER_ADMIN = "super-admin"
}

type DataToken = {
    token: string;
};

type SuccessResponse = {
    success: boolean;
};

type UserIdResponse = {
    user_id: string;
};

export type UserRetrievedResponse = {
    id: number | string;
    role: RoleEnum;
};

export interface IAuthProvider {
    login(email: string, password: string): Promise<StandardResponse<DataToken>>;
    // User must be user role if it's created from this method
    register<T extends Object>(
        user: T,
        email: string,
        password: string,
        role: RoleEnum
    ): Promise<StandardResponse<SuccessResponse>>;
    validateToken(token: string): Promise<StandardResponse<UserIdResponse>>;
    getUserFromAuthById(id: string): Promise<StandardResponse<UserRetrievedResponse>>;
    deleteUser(id: string): Promise<StandardResponse<SuccessResponse>>;
}
