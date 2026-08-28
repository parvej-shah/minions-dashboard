import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // The matcher dictates which routes the middleware runs on.
  // We want it to run on all protected routes (dashboard, api) 
  // but EXCLUDE public routes like /docs, /login, /api/llms, _next, static files, etc.
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/llms (public AI spec)
     * - api/version (healthcheck)
     * - api/auth (NextAuth endpoints)
     * - api/webhooks (public webhook receivers)
     * - docs (public documentation)
     * - login (public auth page)
     * - onboarding (semi-public flow)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icon.svg (icon file)
     * - robots.txt, sitemap.xml, llms.txt, llms-full.txt
     */
    "/((?!api/llms|api/version|api/auth|api/webhooks|api/channels|api/brand/context|docs|login|onboarding|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|llms.txt|llms-full.txt).*)",
  ],
};
