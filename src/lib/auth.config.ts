import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const url = new URL(request.url);
      // Routes reached by n8n rather than a browser. They are NOT unauthenticated:
      // each one verifies the webhook secret itself (verifyWebhookSecret, or the
      // rate-limited check in /api/media/ingest). Listing them here only stops the
      // session gate from bouncing a server-to-server POST to /login.
      //
      // Omitting a route here fails in a way that looks like success: the gate
      // answers 307 to /login, n8n does not follow redirects, so the node reads an
      // empty body and continues. That is exactly how every generated cover image
      // ended up published on a 24-hour Alibaba URL -- /api/media/ingest returned
      // the R2 URL correctly when called directly, but n8n never saw it.
      const publicPaths = [
        "/docs",
        "/api/llms",
        "/api/version",
        "/api/auth",
        "/api/webhooks",
        "/api/channels",
        "/api/brand/context",
        "/api/media/ingest",
        "/api/ideas/craft",
        "/api/internal",
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
