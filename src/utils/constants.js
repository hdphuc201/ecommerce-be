// Những domain được phép truy cập tới tài nguyên của server
export const WHITELIST_DOMAINS = [
  "http://localhost:3000",
  // Không cần local nữa vì ở file config/cors đã luôn luôn cho phép môi trường dev (env.BUILD_MODE === 'dev)
  // 'https://trello-web-rho.vercel.app'
  //...vv, ví dụ sau này sẽ deloy lên domain chính thức...vv
];
