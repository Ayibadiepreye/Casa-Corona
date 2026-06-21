import { env } from "./env.js";
import { logger } from "./logger.js";
import Redis from "ioredis";

let redis: Redis | null = null;
const memoryStore = new Map<string, { value: any; expiresAt: number }>();

// Periodic cleanup of expired keys in the memory fallback
setInterval(() => {
  const now = Date.now();
  for (const [key, { expiresAt }] of memoryStore.entries()) {
    if (expiresAt < now) {
      memoryStore.delete(key);
    }
  }
}, 60000);

function getClient(): Redis | null {
  if (!env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      enableReadyCheck: true,
    });
    redis.on("error", (err) => {
      console.error("[redis] error:", err.message);
    });
    redis.on("connect", () => {
      logger.info("[redis] connected");
    });
  }
  return redis;
}

export async function setEx(key: string, value: any, ttlSeconds: number) {
  const client = getClient();
  // Always store as JSON. Strings get JSON-quoted ("123456") but
  // get() parses them back, so this round-trips correctly for both
  // strings and objects.
  const serialized = JSON.stringify(value);
  if (client) {
    await client.set(key, serialized, "EX", ttlSeconds);
    return;
  }
  const expiresAt = Date.now() + ttlSeconds * 1000;
  memoryStore.set(key, { value: serialized, expiresAt });
}

export async function get(key: string) {
  const client = getClient();
  if (client) {
    const raw = await client.get(key);
    if (raw == null) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return raw;
    }
  }
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  try {
    return JSON.parse(entry.value);
  } catch {
    return entry.value;
  }
}

export async function del(key: string) {
  const client = getClient();
  if (client) {
    await client.del(key);
    return;
  }
  memoryStore.delete(key);
}

export async function exists(key: string): Promise<boolean> {
  const client = getClient();
  if (client) {
    return (await client.exists(key)) === 1;
  }
  const entry = memoryStore.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return false;
  }
  return true;
}

export async function isRedisConnected(): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  return client.status === "ready";
}