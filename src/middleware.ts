import { NextResponse, type NextRequest } from "next/server";
import {
  hasAppwritePublicEnv,
  SESSION_COOKIE,
} from "@/lib/appwrite/config";

const PUBLIC_PREFIXES = [
  "/auth",
  "/api/auth",
  "/api/listings/search",
  "/api/bootstrap",
];
const DEMO_BYPASS =
  process.env.ALLOW_DEMO_BYPASS === "true" ||
  process.env.NEXT_PUBLIC_ALLOW_DEMO_BYPASS === "true";

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/api/demo/sync") {
    if (request.method === "GET") return NextResponse.next();
    if (request.method === "POST") {
      const secret = process.env.DEMO_SYNC_SECRET;
      if (secret) {
        const header = request.headers.get("x-demo-sync-secret");
        if (header !== secret) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      }
      return NextResponse.next();
    }
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Keep middleware edge-safe: only check cookie presence.
  // Full session validation happens in API routes via auth-server.
  if (!hasAppwritePublicEnv()) {
    if (DEMO_BYPASS) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
    }
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    if (DEMO_BYPASS) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/auth", request.url);
    login.searchParams.set("mode", "login");
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
