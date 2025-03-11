import mongoose from "mongoose";
import { env } from "./environment";

export const CONNECT_DB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      bufferCommands: false, // Tắt buffer tránh bị lỗi timeout
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

// Hàm đóng kết nối Database khi cần
export const CLOSE_DB = async () => {
  await mongoose.connection.close();
};
