import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { requireOneOfEnv } from "./env";
import { prisma } from "./prisma";
import type { UserRole } from "@/constants/access";

/**
 * The auth config is built per request, not at module load.
 *
 * NextAuth v5 accepts a factory as well as an object, and it has to be a
 * factory here: `next build` evaluates every route module to collect page data,
 * so reading the Google credentials eagerly made them a *build-time*
 * requirement and broke CI at /api/auth/[...nextauth]. Compiling the app does
 * not need the secrets; serving a request does.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  providers: [
    Google({
      clientId: requireOneOfEnv("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID"),
      clientSecret: requireOneOfEnv("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET"),
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: requireOneOfEnv("AUTH_SECRET", "NEXTAUTH_SECRET"),
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      const cleanEmail = user.email.trim().toLowerCase();

      // Membership, not a whitelist: sign-in succeeds only for an email that
      // already has a `User` row. Self-serve signup creates that row during
      // onboarding (Stripe checkout success), not here — this callback must
      // never auto-provision a tenant just because someone completed Google
      // OAuth, or any Google account could silently become a new tenant.
      const dbUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!dbUser) {
        console.warn(`[NextAuth] Sign-in blocked, no User row for: ${cleanEmail}`);
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      // `user` is only present on the sign-in request itself; every
      // subsequent request just carries the token, so the DB lookup happens
      // once per session, not once per request.
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.trim().toLowerCase() },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.clientId = dbUser.clientId;
          token.role = dbUser.role as UserRole;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = (token.id as string | undefined) ?? "unknown-user";
        session.user.clientId = (token.clientId as string | null | undefined) ?? null;
        session.user.role = (token.role as UserRole | undefined) ?? "MEMBER";
      }
      return session;
    },
  },
}));
