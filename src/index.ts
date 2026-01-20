import "dotenv/config";
import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import cors from "@elysiajs/cors";
import { auth } from "./controllers/auth/controller";
import { activity } from "./controllers/activity/controller";
import { members } from "./controllers/members/controller";
import { contests } from "./controllers/contests/controller";
import { pictures } from "./controllers/picture/controller";
import { results } from "./controllers/results/controller";
import { students } from "./controllers/student/controller";
import { participation } from "./controllers/participation/controller";
import { matchmaking } from "./controllers/matchmaking/controller";
import { helmet } from "elysia-helmet";
import { admins } from "./controllers/admins/controller";

export const app = new Elysia()
  .use(
    cors({
      origin: [process.env.FRONTEND_URL_DEV!, process.env.FRONTEND_URL_PROD!],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "acm-auth-signed-supabase",
      ],
    }),
  )
  .use(helmet())
  .use(swagger())
  .use(auth)
  .use(activity)
  .use(admins)
  .use(members)
  .use(contests)
  .use(results)
  .use(students)
  .use(pictures)
  .use(participation)
  .use(matchmaking)
  .get("/ping", () => "Pong! From Xaverian ACM Chapter")
  .listen(Number(process.env.PORT));

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
