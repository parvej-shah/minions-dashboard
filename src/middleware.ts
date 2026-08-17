import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 1. Always allow webhooks, auth endpoints, and public assets
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;

  // 2. Protect API mutation routes (POST, PATCH, DELETE) against unauthorized requests
  if (pathname.startsWith("/api/")) {
    if (!isLoggedIn && (req.method === "POST" || req.method === "PATCH" || req.method === "DELETE")) {
      const authHeader = req.headers.get("authorization") || req.headers.get("x-api-key") || req.headers.get("x-webhook-secret");
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
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|images).*)"],
};
