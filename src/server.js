import "dotenv/config";

import exitHook from "async-exit-hook";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "path";

import { corsOptions } from "./config/cors";
import { env } from "./config/environment";
import { ClOSE_DB, CONNECT_DB } from "./config/mongodb";
import { CLOSE_REDIS, CONNECT_REDIS, GET_REDIS_CLIENT } from "./config/redis";
import { Router } from "./routes";

const app = express();

// fix cái lỗi cache from dish của expressjs
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use(cors(corsOptions));
app.use("/uploads", express.static(path.resolve("uploads")));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());

app.use((req, res, next) => {
  req.redisClient = GET_REDIS_CLIENT();
  next();
});
app.use(Router);

app.get("/", (_, res) => res.end("<h1>Hello World!</h1><hr>"));

const START_SERVER = () => {
  const port =
    env.BUILD_MODE === "production" ? process.env.PORT : env.LOCAL_DEV_APP_PORT;
  const host =
    env.BUILD_MODE === "production" ? undefined : env.LOCAL_DEV_APP_HOST;

  app.listen(port, host, async () => {
    console.log(
      `3. ${
        env.BUILD_MODE === "production" ? "Production" : "Dev"
      }: Server running at ${host ?? ""}:${port}`
    );
  });
};

// Handle shutdown
exitHook(async () => {
  await ClOSE_DB();
  await CLOSE_REDIS();
  console.log("Disconnected MongoDB & Redis!");
});
process.on("SIGINT", exitHook);
process.on("SIGTERM", exitHook);

(async () => {
  try {
    await CONNECT_DB();
    console.log("1. Connected to MongoDB!");
    await CONNECT_REDIS();
    console.log("2. Connected to Redis!");

    START_SERVER();
  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }
})();
