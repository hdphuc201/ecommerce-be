/* eslint-disable no-console */
/**
 * Updated by trungquandev.com's author on August 17 2023
 * YouTube: https://youtube.com/@trungquandev
 * "A bit of fragrance clings to the hand that gives flowers!"
 */
import express from "express";
import exitHook from "async-exit-hook";
import { CONNECT_DB, ClOSE_DB } from "./config/mongodb";
import { env } from "./config/environment";
import { Router } from "./routes";
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOptions } from "./config/cors";

const START_SERVER = () => {
  const app = express();
  // Cho phép tất cả domain truy cập API (⚠️ Không an toàn cho production)
  app.use(cors(corsOptions));

  app.use(express.json({ limit: "5mb" })); // Cho phép JSON tối đa 5MB
  app.use(express.urlencoded({ extended: true, limit: "5mb" })); // Xử lý form-urlencoded

  app.use(cookieParser()); // Sử dụng middleware để đọc cookie

  app.use(Router);

  app.get("/", (req, res) => {
    res.end("<h1>Hello World!</h1><hr>");
  });

  // Môi trường production cụ thể là render.com
  if (env.BUILD_MODE === "production") {
    // render sẽ tự sinh ra PORT, kh cần chỉ định
    app.listen(process.env.PORT, () => {
      console.log(
        `3. Production: Hello Duy Dev, I am running at Port: ${process.env.PORT}`
      );
    });
  } else {
    app.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, () => {
      console.log(
        `3. Dev: Hello Duy Dev, I am running at ${env.LOCAL_DEV_APP_HOST}:${env.LOCAL_DEV_APP_PORT}/`
      );
    });
  }

  exitHook(() => {
    console.log("Server is shutting down...");
    ClOSE_DB();
    console.log("Disconnect MongoDB Cloud Atlas successfully!");
  });
};

(async () => {
  try {
    console.log("1. Connecting to MongoDB Cloud Atlas...");
    await CONNECT_DB();
    console.log("2. Connected to MongoDB Cloud Atlas!");
    START_SERVER();
  } catch (error) {
    console.error(error);
    process.exit(0);
  }
})();
