import mongoose from "mongoose";
import { env } from "./environment";

export const CONNECT_DB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 40,
        minPoolSize: 5,
      });
    } else {
      console.log("MongoDB already connected");
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Hàm đóng kết nối Database khi cần
export const CLOSE_DB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};
// Đảm bảo đóng khi tắt app
process.on("SIGINT", async () => {
  await CLOSE_DB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await CLOSE_DB();
  process.exit(0);
});
