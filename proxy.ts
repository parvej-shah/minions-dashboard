import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: proxy } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/((?!api/llms|api/version|api/auth|api/webhooks|api/channels|api/brand/context|docs|login|onboarding|_next/static|_next/image|icons/|manifest\\.webmanifest$|sw\\.js$|offline\\.html$|favicon.ico|icon.svg|robots.txt|sitemap.xml|llms.txt|llms-full.txt).*)",
  ],
};
