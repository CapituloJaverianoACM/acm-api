import { Context } from "elysia";
import { BadRequest, Unauthorized } from "./responses";
import MongoDB from "../lib/mongo";
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

export const checkJWTExp = (token: string) => {
    try {
        jwt.verify(token, Bun.env.JWT_SECRET);
        return true;
    } catch(e) {
        return false;
    }
}
export const signJWT = (payload: any) => {
    return jwt.sign({
        // 1 hour
        exp: Math.floor(Date.now() / 1000) + (60*60),
        data: payload
    }, Bun.env.JWT_SECRET);
}

export const verifyJWT = (context: Context) => {
    const auth : string | null = context.request.headers.get("authorization");
    if (!auth) return Unauthorized(context, "No Bearer JWT");
    const [type, token] = auth.split(" ");

    if (type !== 'Bearer') return Unauthorized(context, "Malformed Bearer token");
    let decoded = null;
    try {
        decoded = jwt.verify(token, Bun.env.JWT_SECRET);
    } catch (err) {
        return BadRequest(context, err);
    }
    
    context.store.user = decoded;
}

export const checkBasicAuth = async (context: Context, cb : Function) => {
    const auth : string | null = context.request.headers.get("authorization");
    if (!auth || auth.split(" ")[0] != "Basic" ) return BadRequest(context, "Auth header do not exist or malformed Basic auth header");
    const token = auth.split(" ")[1];
    const [user, password] = Buffer.from(token, 'base64').toString('binary').split(":");

    if (! (await cb(user, password))) return BadRequest(context, "Wrong credentials");

    return {
        success: true,
        user
    }
}

const superUserCallback = (username: string, password: string) : Promise<boolean> => {
    return new Promise( (resolve, _) => {
        resolve((username == Bun.env.USER_MASTER && password == Bun.env.PASSWORD_MASTER))
    });
}

const normalUserCallback = async (email: string, password: string) : Promise<boolean> => {
    const mongoDb = new MongoDB();
    const result = await mongoDb.getOneDocument('users', { email });

    if (!result) return false;

    return (bcrypt.compareSync(password, result.password))
}

export const checkSignIn = async (context: Context) => {

    let res = await checkBasicAuth(context, superUserCallback);
    if (!res.success) res = await checkBasicAuth(context, normalUserCallback);
    if (!res.success) return res;
    context.store.user = {
        email: res.user,
        super: (res.user === Bun.env.USER_MASTER)
    }
}
