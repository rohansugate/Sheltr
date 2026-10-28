import {
  getSyncStorage,
  readDemoState,
  writeDemoState,
} from "@/lib/sync-store";
import type { DemoSyncPayload } from "@/lib/types";
import { isDemoBypassEnabled } from "@/lib/server/demo-mode";

export const dynamic = "force-dynamic";

const disabled = () =>
  Response.json({ error: "Demo sync is disabled" }, { status: 404 });

/** Shared demo room. Only exists when demo bypass is on (no real accounts). */
export async function GET() {
  if (!isDemoBypassEnabled()) return disabled();
  const state = await readDemoState();
  return Response.json({
    state,
    storage: getSyncStorage(),
    ready: getSyncStorage() === "redis" || state !== null,
  });
}

export async function POST(request: Request) {
  if (!isDemoBypassEnabled()) return disabled();
  const body = (await request.json()) as { state?: DemoSyncPayload };
  if (!body.state) {
    return Response.json({ error: "Missing state" }, { status: 400 });
  }

  const state = await writeDemoState(body.state);
  return Response.json({
    ok: true,
    state,
    storage: getSyncStorage(),
  });
}
