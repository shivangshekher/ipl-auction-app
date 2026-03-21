import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// We need separate connections for Pub/Sub and standard commands in ioredis
export const redisPub = new Redis(redisUrl);
export const redisSub = new Redis(redisUrl);
export const redisState = new Redis(redisUrl); // for locks and state logic
