import { NextResponse } from "next/server";
import { signOutSession } from "@/lib/auth-server";

export async function POST() {
  try {
    await signOutSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
