import { NextResponse } from "next/server";
import { listDomainForUser } from "@/lib/appwrite/data";
import { getSessionActor } from "@/lib/server/actor";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await getSessionActor();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const data = await listDomainForUser(actor);
    return NextResponse.json({ ...data, syncedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
