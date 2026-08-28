import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { constantTimeEqual } from "@/lib/security";
import { IMPERSONATION_COOKIE } from "@/lib/tenant";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";

/**
 * The auth gate, wrapped once at module load.
 *
 * `lib/auth.ts` builds its config from a factory (so that `next build` does not
 * need the Google secrets), and for a factory config next-auth's `auth()`
 * wrapper is itself async — it returns a Promise of the middleware, not the
 * middleware. Next requires the proxy's default export to be a function, so the
 * promise is created once here and awaited per request; it resolves once and the
 * per-request config resolution happens inside next-auth either way.
 */
const gateHandler = auth(async (req) => {
  const { pathname } = req.nextUrl;

  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  const isLoggedIn = !!req.auth || !!sessionToken;
  const sessionUser = req.auth?.user;

  // 1. Always allow auth endpoints, webhooks, static public assets
  if (
    pathname.startsWith("/llms") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/onboarding") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/manifest.json" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/sw.js" ||
    pathname.endsWith(".txt") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  // 1.6 n8n's own callback into a PipelineRun (server-to-server, no browser
  // session to present) -- this blanket gate blocked it with a 401 for as
  // long as the PipelineRun feature has existed: every harvest/draft run
  // got stuck at RUNNING forever because n8n's "Callback Harvested"/
  // "Callback Completed" node could never actually reach this route. GET
  // stays behind the normal auth gate below (the route itself also calls
  // requireClientId() for GET); only PATCH -- the callback -- is exempted,
  // matching /api/webhooks' existing no-auth-required treatment of other
  // n8n-initiated writes.
  if (req.method === "PATCH" && /^\/api\/pipeline\/runs\/[^/]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // 1.5 Redirect logged-in users with a clientId away from /login and the bare
  // /onboarding landing page (sign-in + company/plan) -- but NOT away from
  // /onboarding/setup or /onboarding/done. Those two pages are for a user who
  // *just* got a clientId attached (the landing page's own "create client"
  // step sets it) and are mid-flow or wrapping up, not someone who needs to
  // be bounced back to the dashboard. Getting this wrong is a real bug that
  // shipped once already: with pathname.startsWith("/onboarding") matching
  // all three onboarding pages, and the jwt() callback now always re-reading
  // clientId from the DB on every session check (see src/lib/auth.ts), the
  // very next server round-trip after company creation would see the fresh
  // clientId and immediately redirect the user out of setup/setup before
  // they configured anything.
  if (pathname === "/login" || pathname === "/onboarding") {
    if (isLoggedIn && sessionUser?.clientId) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
    return NextResponse.next();
  }
  if (pathname.startsWith("/onboarding")) {
    return NextResponse.next();
  }

  // 2. Protect API routes against unauthorized access
  if (pathname.startsWith("/api/")) {
    if (!isLoggedIn) {
      const authHeader =
        req.headers.get("authorization") ||
        req.headers.get("x-api-key") ||
        req.headers.get("x-webhook-secret");
      const validSecret = process.env.BLOG_API_SECRET;

      // Allow if valid internal secret is provided (for n8n pipelines & server-to-server calls).
      // Constant-time compare -- a plain `===` here is a timing side-channel on the secret.
      if (
        validSecret &&
        authHeader &&
        (constantTimeEqual(authHeader, validSecret) || constantTimeEqual(authHeader, `Bearer ${validSecret}`))
      ) {
        return NextResponse.next();
      }

      return NextResponse.json(
        { error: "Unauthorized: Authentication required. Please sign in with an authorized Google admin account." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 3. Strict Gate for all Frontend Pages: If not logged in, redirect to /login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Tenant gate: a logged-in user with no clientId and who isn't platform
  // staff hasn't finished onboarding yet (self-serve signup creates the User
  // row with clientId: null; the onboarding wizard's plan-selection step is
  // what attaches a Client). Send them there instead of into the dashboard.
  //
  // src/lib/auth.ts's jwt() callback always re-reads clientId/role from the
  // DB now, but middleware's req.auth may be decoding the session cookie
  // without running that callback (this repo's own edge/middleware auth
  // path has been observed to lag a fresh DB write before). This extra
  // re-check costs one indexed lookup, only in this one branch -- i.e. only
  // for a session that looks tenant-less -- so everyone else's page loads
  // stay fast.
  const isPlatformStaff = sessionUser?.role === "SYSTEM_ADMIN";

  // 4.5 Platform staff with no active tenant scope land on /platform-admin instead of letting
  // "/" 403 underneath them, unless they have a clientId or an impersonation session.
  if (pathname === "/" && isPlatformStaff && !sessionUser?.clientId && !req.cookies.get(IMPERSONATION_COOKIE)) {
    return NextResponse.redirect(new URL("/platform-admin", req.nextUrl.origin));
  }

  if (sessionUser && !sessionUser.clientId && !isPlatformStaff) {
    try {
      const freshUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { clientId: true },
      });
      if (freshUser && freshUser.clientId === null) {
        return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
      }
    } catch {
      // In case of transient DB connection error, do not bounce the user out
    }
  }

  return NextResponse.next();
});

/**
 * next-auth types `auth(handler)` as returning the middleware directly, which
 * holds for an object config but not for the factory config this app uses — at
 * runtime it is a Promise of the middleware. The cast states what actually comes
 * back so the await below is honest rather than a type error.
 */
const gate = gateHandler as unknown as Promise<NextMiddleware>;

/** Next requires the proxy default export to be a function, not a promise. */
export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;
  if (
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt" ||
    pathname === "/robots.txt" ||
    pathname.endsWith(".txt") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg")
  ) {
    return NextResponse.next();
  }

  const handler = await gate;
  return handler(request, event);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|images|icons|llms.txt|llms-full.txt|robots.txt).*)",
  ],
};
