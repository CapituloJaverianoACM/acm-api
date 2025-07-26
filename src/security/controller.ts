import Elysia, { t } from "elysia";
import { checkSignIn } from "../utils/auth";
import { loginHandler, verifyHandler } from "./handlers";

export const auth = new Elysia({ prefix: "/auth" })
    .state("user", {})
    .get("login", loginHandler, {
        beforeHandle: checkSignIn,
    })
    .post("verify", verifyHandler, {
        body: t.Object({
            token: t.String(),
        }),
    });
