import "dotenv/config";
import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import cors from "@elysiajs/cors";
import { auth } from "./controllers/AuthController";
import { activity } from "./controllers/ActivityController";
import { members } from "./controllers/MemberController";
import { contests } from "./controllers/ContestController";
import { pictures } from "./controllers/PictureController";
import { results } from "./controllers/ResultController";
import { students } from "./controllers/StudentController";
import { participation } from "./controllers/ParticipationController";
import { matchmaking } from "./controllers/MatchmakingController";
import { helmet } from "elysia-helmet";
import { admins } from "./controllers/AdminsController";
import { match } from "./controllers/match/controller";

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
  .use(match)
  .get("/ping", () => "Pong! From Xaverian ACM Chapter")
  .listen(Number(process.env.PORT));

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
console.log(
  `🔌 WebSocket available at ws://${app.server?.hostname}:${app.server?.port}/ws/contest/:contestId`,
);
