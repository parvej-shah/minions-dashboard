import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const url = new URL(request.url);
      const publicPaths = [
        "/docs",
        "/api/llms",
        "/api/version",
        "/api/auth",
        "/api/webhooks",
        "/login"
      ];
      if (publicPaths.some(p => url.pathname.startsWith(p))) {
        return true;
      }
      // For all other routes, require a valid session
      return !!auth;
    },
  },
};
