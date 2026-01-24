import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const authRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/auth",
});

export const appointmentsApiRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/api",
});

export const othersApiRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/api",
});