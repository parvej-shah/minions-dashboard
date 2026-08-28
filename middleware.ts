import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. PUBLIC ROUTES: docs, llms.txt, api/llms, webhooks, auth, static assets
  if (
    pathname === "/docs" ||
    pathname.startsWith("/docs") ||
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/llms") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/api/llms") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/onboarding") ||
    pathname.startsWith("/api/auth") ||
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
  if (request.method === "PATCH" && /^\/api\/pipeline\/runs\/[^/]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Check auth session token
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  const isLoggedIn = !!sessionToken;

  // 1.5 Redirect logged-in users away from /login
  if (pathname === "/login" || pathname === "/onboarding") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", request.nextUrl.origin));
    }
    return NextResponse.next();
  }

  // 2. Protect internal API routes
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/llms") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/webhooks") &&
    !pathname.startsWith("/api/onboarding")
  ) {
    if (!isLoggedIn) {
      const authHeader =
        request.headers.get("authorization") ||
        request.headers.get("x-api-key") ||
        request.headers.get("x-webhook-secret");
      const validSecret = process.env.BLOG_API_SECRET;

      if (validSecret && authHeader && (authHeader === validSecret || authHeader === `Bearer ${validSecret}`)) {
        return NextResponse.next();
      }

      return NextResponse.json(
        { error: "Unauthorized: Authentication required." },
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
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|images|icons).*)",
  ],
};
