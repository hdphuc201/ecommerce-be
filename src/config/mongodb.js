// duyphucdev1
// twRqcEf3afxSeAhA

import { MongoClient, ServerApiVersion } from "mongodb";
import { env } from "./environment";

let dataInstance = null; // giá trị ban đầu của dataInstance là null vì chưa kết nối

// Connects to MongoDB and sets a Stable API version
const mongoClientInstance = new MongoClient(env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1, // Thiết lập phiên bản API ổn định (v1)
    strict: true, // Bật chế độ nghiêm ngặt
    deprecationErrors: true, // Hiển thị lỗi nếu có tính năng bị loại bỏ
  },
  tls: true, // Enable TLS
  tlsAllowInvalidCertificates: true, // Allow invalid certificates (useful for development)
});

// Hàm kết nối và truy cập cơ sở dữ liệu
export const CONNECT_DB = async () => {
  try {
    await mongoClientInstance.connect(); // Kết nối tới MongoDB
    console.log("Connected to MongoDB with Stable API Version v1.");
    // tận dụng lại db
    dataInstance = mongoClientInstance.db(env.DATABASE_NAME);
    // Bạn có thể thực hiện các thao tác trên `db` tại đây
  } catch (error) {
    console.error(error);
    process.exit(0);
  }
};

// Đóng kết nối Database khi cần
export const ClOSE_DB = async () => {
  await mongoClientInstance.close();
};

// function này sẽ trả về dataInstance đã được kết nối thành công tới mongoDB để sử dụng nhieu nơi khác nhau trong code
// lưu ý phải đảm bảo chỉ luôn gọi tới GET_DB này sau khi đã kết nối thành công tới MongoDB
export const GET_DB = () => {
  if (!dataInstance) throw new Error("Must connect to Database first");
  return dataInstance;
};
