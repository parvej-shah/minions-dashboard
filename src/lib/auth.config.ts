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
      // each one verifies the webhook secret itself (verifyWebhookSecret). Listing
      // them here only stops the
      // session gate from bouncing a server-to-server POST to /login.
      //
      // Omitting a route here fails in a way that looks like success: the gate
      // answers 307 to /login, n8n does not follow redirects, so the node reads an
      // empty body and continues. That is how every AI cover image once ended
      // up published on a 24-hour Alibaba URL: the upload route returned the R2
      // URL correctly when called directly, but n8n never saw it.
      const publicPaths = [
        "/docs",
        "/api/llms",
        "/api/version",
        "/api/auth",
        "/api/webhooks",
        "/api/channels",
        "/api/brand/context",
        "/api/ideas/craft",
        "/api/internal",
        // n8n PATCHes the terminal state of a run here when a workflow finishes
        // or its error handler fires. This was gated, so every callback was
        // bounced to /login and every pipeline_runs row stayed RUNNING forever
        // -- which is why the progress HUD spun indefinitely and the Idea Stream
        // never refreshed on its own. The route verifies the webhook secret.
        "/api/pipeline/runs",
        // Sets the pending-signup cookie right before Google sign-in, so its
        // caller has no session by definition. While this was gated the POST
        // was answered 307, the cookie was never set, and the signIn callback
        // refused every brand-new account ("Sign-in failed"). It only sets a
        // short-lived cookie; the other /api/onboarding routes stay gated.
        "/api/onboarding/begin",
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
