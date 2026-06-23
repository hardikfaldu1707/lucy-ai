import "server-only";

import { Redis } from "@upstash/redis";

function upstashRedisCredentials(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "";
  if (!url || !token) return null;
  return { url, token };
}

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const creds = upstashRedisCredentials();
  redisClient = creds ? new Redis({ url: creds.url, token: creds.token }) : null;
  return redisClient;
}

type DevEntry = { value: string; expiresAt: number };

const devStore = new Map<string, DevEntry>();

function devGet(key: string): string | null {
  const entry = devStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    devStore.delete(key);
    return null;
  }
  return entry.value;
}

function devSet(key: string, value: string, ttlSeconds: number): void {
  devStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function devIncr(key: string, ttlSeconds: number): number {
  const current = devGet(key);
  const next = (current ? parseInt(current, 10) : 0) + 1;
  devSet(key, String(next), ttlSeconds);
  return next;
}

export async function redisGet(key: string): Promise<string | null> {
  const redis = getRedis();
  if (redis) {
    const val = await redis.get<string>(key);
    return val ?? null;
  }
  return devGet(key);
}

export async function redisSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(key, value, { ex: ttlSeconds });
    return;
  }
  devSet(key, value, ttlSeconds);
}

export async function redisIncr(key: string, ttlSeconds: number): Promise<number> {
  const redis = getRedis();
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, ttlSeconds);
    }
    return count;
  }
  return devIncr(key, ttlSeconds);
}

export async function redisDel(...keys: string[]): Promise<void> {
  const redis = getRedis();
  if (redis) {
    if (keys.length) await redis.del(...keys);
    return;
  }
  for (const key of keys) devStore.delete(key);
}
