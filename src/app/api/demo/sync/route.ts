import {
  getSyncStorage,
  readDemoState,
  writeDemoState,
} from "@/lib/sync-store";
import type { DemoSyncPayload } from "@/lib/types";

export async function GET() {
  const state = await readDemoState();
  return Response.json({
    state,
    storage: getSyncStorage(),
    ready: getSyncStorage() === "redis" || state !== null,
  });
}

export async function POST(request: Request) {
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
