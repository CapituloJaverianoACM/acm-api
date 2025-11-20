import { Context } from "elysia";
import { BadRequest, Unauthorized } from "./responses";
import { IDatabase } from "../db/database.interface";
import { MongoAdapter } from "../db/mongo/mongo.adapter";
import SupabaseDB from "../db/supabase/supabase";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

export const checkJWTExp = (token: string): any | null => {
    try {
        return jwt.verify(token, Bun.env.JWT_SECRET);
    } catch (e) {
        return null;
    }
};
export const signJWT = (payload: any) => {
    return jwt.sign(
        {
            // 1 hour
            exp: Math.floor(Date.now() / 1000) + 60 * 60,
            data: payload,
        },
        Bun.env.JWT_SECRET,
    );
};

export const verifyJWT = async (context: Context) => {
    const auth: string | null = context.request.headers.get("authorization");
    if (!auth) return Unauthorized(context, "No Bearer JWT");
    const [type, token] = auth.split(" ");

    if (type !== "Bearer") return Unauthorized(context, "Malformed Bearer token");
    let decoded = null;
    /*/ acm-auth-signed-supabase */
    if (context.request.headers.get("acm-auth-signed-supabase")) {
        decoded = await SupabaseDB.getInstance().verifySignedJWT(token)
        if (decoded != null) {
            decoded = { email: decoded.email! };
        }
    }
    else {
        decoded = checkJWTExp(token);
    }
    if (!decoded) return Unauthorized(context, "Token isn't valid");

    context.store.user = decoded;
};

export const checkBasicAuth = async (context: Context, cb: Function) => {
    const auth: string | null = context.request.headers.get("authorization");
    if (!auth || auth.split(" ")[0] != "Basic")
        return BadRequest(
            context,
            "Auth header do not exist or malformed Basic auth header",
        );
    const token = auth.split(" ")[1];
    const [user, password] = Buffer.from(token, "base64")
        .toString("binary")
        .split(":");

    if (!(await cb(user, password)))
        return BadRequest(context, "Wrong credentials");

    return {
        success: true,
        user,
    };
};

const superUserCallback = (
    username: string,
    password: string,
): Promise<boolean> => {
    return new Promise((resolve, _) => {
        resolve(
            username == Bun.env.USER_MASTER && password == Bun.env.PASSWORD_MASTER,
        );
    });
};

const normalUserCallback = async (
    email: string,
    password: string,
): Promise<boolean> => {
    const db: IDatabase = new MongoAdapter();
    const result = await db.getBy("users", { email });

    if (result.error) return false;

    return bcrypt.compareSync(password, result.data.password);
};

export const checkSignIn = async (context: Context) => {
    let res = await checkBasicAuth(context, superUserCallback);
    if (!res.success) res = await checkBasicAuth(context, normalUserCallback);
    if (!res.success) return res;
    context.store.user = {
        email: res.user,
        super: res.user === Bun.env.USER_MASTER,
    };
};
