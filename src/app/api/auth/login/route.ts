import { NextResponse } from "next/server";
import { authenticateUser, toAppUser } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await authenticateUser(
      body.email ?? "",
      body.password ?? "",
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ user: toAppUser(result.user) });
  } catch {
    return NextResponse.json(
      { error: "Could not sign in. Try again." },
      { status: 500 },
    );
  }
}
