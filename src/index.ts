import { Elysia } from "elysia";
import 'dotenv/config'
import { user } from "./user/controller";
import { swagger } from '@elysiajs/swagger'

const app = new Elysia()
                .use(swagger())
                .use(user)
                .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
