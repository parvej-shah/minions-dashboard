import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 1. Always allow auth endpoints, webhooks, login page, and public static assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/sw.js" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;

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

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|images|icons).*)"],
};
