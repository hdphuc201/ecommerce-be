// config/redis.js
import { createClient } from "redis";
import { env } from "./environment";

let redisClient;

const CONNECT_REDIS = async () => {
  redisClient = createClient({
    url: env.REDIS_URL, // bạn đã có biến REDIS_URL trong .env
  });

  redisClient.on("error", (err) => console.error("Redis Client Error", err));

  await redisClient.connect();
};

const CLOSE_REDIS = async () => {
  if (redisClient) {
    await redisClient.quit();
  }
};

const GET_REDIS_CLIENT = () => {
  if (!redisClient) throw new Error("Redis client not initialized!");
  return redisClient;
};

export { CONNECT_REDIS, CLOSE_REDIS, GET_REDIS_CLIENT };
