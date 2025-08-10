import { Elysia } from "elysia";
import "dotenv/config";
import { user } from "./user/controller";
import { swagger } from "@elysiajs/swagger";
import { auth } from "./security/controller";
import { activity } from "./activity/controller";
import { members } from "./members/controller";
import { contests } from "./contests/controller";
import { pictures } from "./picture/controller";
import cors from "@elysiajs/cors";
import { results } from "./results/controller";
import { students } from "./student/controller";

export const app = new Elysia()
  .use(
    cors({
      origin: [process.env.FRONTEND_URL_DEV!, process.env.FRONTEND_URL!],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(swagger())
  .use(auth)
  .use(activity)
  .use(user)
  .use(members)
  .use(contests)
  .use(results)
  .use(students)
  .use(pictures)
  .get("/ping", () => "Pong! From Xaverian ACM Chapter")
  .listen(Number(process.env.PORT));

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
