import { NextResponse, type NextRequest } from "next/server";

import { isSettingsSection } from "@/lib/nav";
import { SESSION_COOKIE, verifySession } from "@/lib/session-core";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (the file convention and exported function are `proxy`).
// Protects everything except /login, /api/auth/*, /api/telegram/webhook and static assets.

const PUBLIC_PATHS = [/^\/login$/, /^\/api\/auth\//, /^\/api\/telegram\/webhook$/];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Dev-only gallery: reachable without a session outside production, 404 in production.
  if (pathname === "/dev" || pathname.startsWith("/dev/")) {
    if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
    return NextResponse.next();
  }

  const secret = process.env.SESSION_SECRET ?? "";
  const session = secret.length >= 32 ? await verifySession(request.cookies.get(SESSION_COOKIE)?.value, secret) : null;
  const isPublic = PUBLIC_PATHS.some((re) => re.test(pathname));

  if (isPublic) {
    // Already signed in → no need for the login page.
    if (pathname === "/login" && session) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/" && pathname !== "/dashboard") loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Unknown settings sections get a real 404 status (notFound() inside a streamed page would answer 200).
  const settings = /^\/settings\/([^/]+)\/?$/.exec(pathname);
  if (settings && !isSettingsSection(settings[1])) return NextResponse.rewrite(new URL("/_not-found", request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|woff2?)$).*)"],
};
