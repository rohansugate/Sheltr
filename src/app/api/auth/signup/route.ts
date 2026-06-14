import { NextResponse } from "next/server";
import { createUser, toAppUser } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createUser({
      email: body.email ?? "",
      password: body.password ?? "",
      firstName: body.firstName ?? "",
      lastName: body.lastName ?? "",
      role: body.role,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ user: toAppUser(result.user) });
  } catch {
    return NextResponse.json(
      { error: "Could not create account. Try again." },
      { status: 500 },
    );
  }
}
