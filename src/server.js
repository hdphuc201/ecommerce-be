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

const START_SERVER = () => {
  const app = express();
  // Cho phép tất cả domain truy cập API (⚠️ Không an toàn cho production)
  app.use(
    cors({
      origin: "http://localhost:3000", // ⚠️ Thay bằng URL của FE // Hoặc thêm chính xác FE: "http://localhost:3000"
      credentials: true, // Bắt buộc nếu gửi cookie từ FE
    })
  );

  app.use(express.json());
  app.use(cookieParser()); // Sử dụng middleware để đọc cookie

  app.use(Router);

  app.get("/", (req, res) => {
    res.end("<h1>Hello World!</h1><hr>");
  });

  app.listen(env.APP_PORT, env.APP_HOST, () => {
    console.log(
      `Hello Duy Dev, I am running at ${env.APP_HOST}:${env.APP_PORT}/`
    );
  });

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
