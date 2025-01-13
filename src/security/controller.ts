import Elysia from "elysia";
import { checkSignIn } from "../utils/auth";
import { loginHandler } from "./handlers";

export const auth = new Elysia({ prefix: '/auth' })
        .state('user', {})
        .get('login', loginHandler, {
            beforeHandle: checkSignIn
        });
