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

const START_SERVER = () => {
  const app = express();
  // Cho phép tất cả domain truy cập API (⚠️ Không an toàn cho production)
  app.use(cors(corsOptions));

  app.use("/uploads", express.static(path.resolve("uploads")));

  app.use(express.json({ limit: "5mb" })); // Cho phép JSON tối đa 5MB
  app.use(express.urlencoded({ extended: true, limit: "5mb" })); // Xử lý form-urlencoded

  app.use(cookieParser()); // Sử dụng middleware để đọc cookie
  // Thêm redisClient vào req để các routes dùng được
  app.use((req, res, next) => {
    req.redisClient = GET_REDIS_CLIENT(); // Dùng req.redisClient ở route
    next();
  });
  app.use(Router);

  app.get("/", (req, res) => {
    res.end("<h1>Hello World!</h1><hr>");
  });

  // Môi trường production cụ thể là render.com
  if (env.BUILD_MODE === "production") {
    // render sẽ tự sinh ra PORT, kh cần chỉ định
    const port = process.env.PORT;
    app.listen(port, () => {
      console.log(
        `3. Production: Hello Duy Dev, I am running at Port: ${port}`
      );
    });
  } else {
    app.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, () => {
      console.log(
        `3. Dev: Hello Duy Dev, I am running at ${env.LOCAL_DEV_APP_HOST}:${env.LOCAL_DEV_APP_PORT}`
      );
    });
  }

  //  Trên Windows, đôi khi Ctrl + C không kích hoạt đúng async-exit-hook hoặc không đảm bảo chờ hàm ClOSE_DB hoàn thành.
  // Không giảm số connection trong MongoDB Atlas dashboard → Có thể bị hết connection mà không biết lý do.
  exitHook(async () => {
    console.log("Server is shutting down...");
    await ClOSE_DB();
    await CLOSE_REDIS();
    console.log("Disconnect MongoDB Cloud Atlas successfully!");
  });
  process.on("SIGINT", exitHook); // Nhấn Ctrl + C
  process.on("SIGTERM", exitHook);
};

(async () => {
  try {
    console.log("1. Connecting to MongoDB Cloud Atlas...");
    await CONNECT_DB();
    console.log("2. Connected to MongoDB Cloud Atlas!");
    console.log("Connecting to Redis...");
    await CONNECT_REDIS();
    console.log("Connected to Redis!");
    START_SERVER();
  } catch (error) {
    console.error(error);
    process.exit(0);
  }
})();
