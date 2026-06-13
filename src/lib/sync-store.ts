import type { DemoSyncPayload } from "./types";
import { mergeDemoPayload } from "./sync-merge";

export const DEMO_SYNC_KEY = process.env.DOORWAY_DEMO_ROOM ?? "doorway-hackathon";

const globalStore = globalThis as typeof globalThis & {
  __doorwayDemoSync?: DemoSyncPayload | null;
};

function hasRedisEnv() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

function memoryGet(): DemoSyncPayload | null {
  return globalStore.__doorwayDemoSync ?? null;
}

function memorySet(state: DemoSyncPayload) {
  globalStore.__doorwayDemoSync = state;
}

async function redisGet(): Promise<DemoSyncPayload | null> {
  const { Redis } = await import("@upstash/redis");
  const redis = Redis.fromEnv();
  return redis.get<DemoSyncPayload>(DEMO_SYNC_KEY);
}

async function redisSet(state: DemoSyncPayload) {
  const { Redis } = await import("@upstash/redis");
  const redis = Redis.fromEnv();
  await redis.set(DEMO_SYNC_KEY, state);
}

export type SyncStorage = "redis" | "memory";

export function getSyncStorage(): SyncStorage {
  return hasRedisEnv() ? "redis" : "memory";
}

export async function readDemoState(): Promise<DemoSyncPayload | null> {
  if (hasRedisEnv()) {
    try {
      return await redisGet();
    } catch {
      return memoryGet();
    }
  }
  return memoryGet();
}

export async function writeDemoState(
  incoming: DemoSyncPayload,
): Promise<DemoSyncPayload> {
  const current = await readDemoState();
  const next = mergeDemoPayload(current, incoming);

  if (hasRedisEnv()) {
    try {
      await redisSet(next);
      return next;
    } catch {
      memorySet(next);
      return next;
    }
  }

  memorySet(next);
  return next;
}
