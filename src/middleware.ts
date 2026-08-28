import { constantTimeEqual } from "@/lib/security";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;

  // 1. PUBLIC ROUTES (Zero-Auth Required)
  if (
    pathname.includes("docs") ||
    pathname.includes("llms") ||
    pathname.includes("robots") ||
    pathname.startsWith("/docs") ||
    pathname === "/docs" ||
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/llms") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/api/llms") ||
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

  // 1.6 n8n pipeline callbacks
  if (req.method === "PATCH" && /^\/api\/pipeline\/runs\/[^/]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Check authentication session tokens
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  const isLoggedIn = !!sessionToken;

  // 1.5 Redirect logged-in users away from /login
  if (pathname === "/login" || pathname === "/onboarding") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
    return NextResponse.next();
  }
  if (pathname.startsWith("/onboarding")) {
    return NextResponse.next();
  }

  // 2. Protect internal API routes
  if (pathname.startsWith("/api/")) {
    if (!isLoggedIn) {
      const authHeader =
        req.headers.get("authorization") ||
        req.headers.get("x-api-key") ||
        req.headers.get("x-webhook-secret");
      const validSecret = process.env.BLOG_API_SECRET;

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

  // 3. Strict Gate for Private Dashboard Pages ONLY
  const isDashboardRoute =
    pathname === "/" ||
    pathname.startsWith("/ideas") ||
    pathname.startsWith("/editorial") ||
    pathname.startsWith("/drafts") ||
    pathname.startsWith("/fleet") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/platform-admin");

  if (isDashboardRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|images|icons|docs|llms|robots).*)",
  ],
};
