import { auth } from "@/lib/auth";
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
const gateHandler = auth((req) => {
  const { pathname } = req.nextUrl;

  // 1. Always allow auth endpoints, webhooks, login page, static public
  // assets, and the onboarding wizard. Onboarding has to be reachable by
  // both a signed-out visitor (the signup landing) and a signed-in user with
  // no clientId yet (mid-flow) — its own pages/routes handle whatever auth
  // state they need, rather than the blanket gates below.
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/api/onboarding") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/manifest.json" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/sw.js" ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  // Check Auth.js session object OR session cookie token
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  const isLoggedIn = !!req.auth || !!sessionToken;

  // 2. Protect API routes against unauthorized access
  if (pathname.startsWith("/api/")) {
    if (!isLoggedIn) {
      const authHeader =
        req.headers.get("authorization") ||
        req.headers.get("x-api-key") ||
        req.headers.get("x-webhook-secret");
      const validSecret = process.env.BLOG_API_SECRET;

      // Allow if valid internal secret is provided (for n8n pipelines & server-to-server calls)
      if (validSecret && (authHeader === validSecret || authHeader === `Bearer ${validSecret}`)) {
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
  const sessionUser = req.auth?.user;
  const isPlatformStaff = sessionUser?.clientId === null && sessionUser?.role === "SYSTEM_ADMIN";
  if (sessionUser && !sessionUser.clientId && !isPlatformStaff) {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
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
  const handler = await gate;
  return handler(request, event);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg, images, icons
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|images|icons).*)",
  ],
};
