import express from "express";
import exitHook from "async-exit-hook";
import { CONNECT_DB, ClOSE_DB } from "./config/mongodb";
import { env } from "./config/environment";
import { Router } from "./routes";
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOptions } from "./config/cors";
import { CLOSE_REDIS, CONNECT_REDIS, GET_REDIS_CLIENT } from "./config/redis";
import "dotenv/config";
import path from "path";

const app = express();

// Middlewares
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

// Simple health check route
app.get("/", (_, res) => res.end("<h1>Hello World!</h1><hr>"));

// Start server
const START_SERVER = () => {
  const port =
    env.BUILD_MODE === "production" ? process.env.PORT : env.LOCAL_DEV_APP_PORT;
  const host =
    env.BUILD_MODE === "production" ? undefined : env.LOCAL_DEV_APP_HOST;

  app.listen(port, host, () => {
    console.log(
      `${
        env.BUILD_MODE === "production" ? "Production" : "Dev"
      }: Server running at ${host ?? ""}:${port}`
    );
  });
};

// Handle shutdown
exitHook(async () => {
  console.log("Server is shutting down...");
  await ClOSE_DB();
  await CLOSE_REDIS();
  console.log("Disconnected MongoDB & Redis!");
});
process.on("SIGINT", exitHook);
process.on("SIGTERM", exitHook);

// Main bootstrap
(async () => {
  try {
    console.log("Connecting to MongoDB...");
    await CONNECT_DB();
    console.log("Connected to MongoDB!");

    console.log("Connecting to Redis...");
    await CONNECT_REDIS();
    console.log("Connected to Redis!");

    START_SERVER();
  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }
})();
