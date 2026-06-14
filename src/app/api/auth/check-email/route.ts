import { NextResponse } from "next/server";
import { lookupProfileByEmail, normalizeEmail, toAppUser } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email ?? "");
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }

    const profile = await lookupProfileByEmail(email);
    if (!profile) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      user: toAppUser({
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: profile.role,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not verify account." },
      { status: 500 },
    );
  }
}
