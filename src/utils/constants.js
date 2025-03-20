// Những domain được phép truy cập tới tài nguyên của server
export const WHITELIST_DOMAINS = [
  "http://localhost:3000",
  // Không cần local nữa vì ở file config/cors đã luôn luôn cho phép môi trường dev (env.BUILD_MODE === 'dev)
  "https://hdpstore.vercel.app",
  // "http://192.168.1.4:3000/",
  // "http://192.168.56.1:3000/",
  // "http://192.168.1.4:3000/",
  // "http://172.30.80.1:3000/",

  //...vv, ví dụ sau này sẽ deloy lên domain chính thức...vv
];
