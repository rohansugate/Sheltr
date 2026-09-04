import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./config";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function setSessionCookie(secret: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, secret, COOKIE_OPTS);
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionSecret(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}
