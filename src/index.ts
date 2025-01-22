import { Elysia } from "elysia";
import 'dotenv/config'
import { user } from "./user/controller";
import { swagger } from '@elysiajs/swagger'
import { auth } from "./security/controller";
import { activity } from "./activity/controller";

const app = new Elysia()
                .use(swagger())
                .use(auth)
                .use(activity)
                .use(user)
                .get('/ping', () => "Pong! From Xaverian ACM Chapter")
                .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
