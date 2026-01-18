import { IAuthProvider } from "../auth/auth.provider.interface";

export class AuthService {
  constructor(private authProvider: IAuthProvider) {}

  async login(
    user: string,
    password: string,
  ): Promise<{ error: string | null; data: any }> {
    const result = await this.authProvider.login(user, password);
    if (result.error) {
      return { error: "Wrong credentials", data: null };
    }
    return { error: null, data: result.data };
  }

  async validateToken(
    token: string,
  ): Promise<{ error: string | null; data: any }> {
    const result = await this.authProvider.validateToken(token);
    if (result.error) {
      return { error: "Token isn't valid", data: null };
    }
    return { error: null, data: "Token is good." };
  }
}
