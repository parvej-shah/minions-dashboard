import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";
import { requireOneOfEnv } from "./env";
import { prisma } from "./prisma";
import { consumePendingSignup } from "./onboarding";
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
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "dummy",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "dummy",
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "minions-ai-secret-key-fallback-32-chars",
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (!user?.email) return false;
      const cleanEmail = user.email.trim().toLowerCase();

      // Membership, not a whitelist: sign-in succeeds for an email that
      // already has a `User` row, for a brand new email arriving via the
      // onboarding wizard specifically (src/lib/onboarding.ts's signed
      // cookie, set only when the user clicked "Start free trial"), or for
      // an email with a pending team invite (a ClientMembership row with no
      // userId yet — see /api/team/invite). Without one of those checks, any
      // Google account hitting /login could silently provision itself a
      // bare User row.
      const dbUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (dbUser) return true;

      const pendingInvite = await prisma.clientMembership.findFirst({
        where: { email: cleanEmail, userId: null },
        orderBy: { invitedAt: "asc" },
      });
      if (pendingInvite) {
        // Joining an existing tenant, not creating one: the invite's own
        // clientId/role become this user's active workspace immediately,
        // skipping the onboarding wizard entirely.
        const newUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            name: user.name ?? null,
            clientId: pendingInvite.clientId,
            role: pendingInvite.role,
          },
        });
        await prisma.clientMembership.update({
          where: { id: pendingInvite.id },
          data: { userId: newUser.id, acceptedAt: new Date() },
        });
        return true;
      }

      const isPendingSignup = await consumePendingSignup().catch(() => false);
      if (!isPendingSignup) {
        console.warn(`[NextAuth] Sign-in blocked, no User row for: ${cleanEmail}`);
        return false;
      }

      // clientId stays null until the onboarding wizard's plan-selection
      // step creates a Client and attaches it — see /api/onboarding/client.
      await prisma.user.create({
        data: { email: cleanEmail, name: user.name ?? null, role: "MEMBER" },
      });
      return true;
    },
    async jwt({ token, user }) {
      // Always re-read the User row, not just at sign-in. clientId/role can
      // change mid-session (onboarding attaches a Client, an invite gets
      // accepted, a workspace switch flips the active tenant) and this app's
      // rule everywhere else (see src/lib/tenant.ts) is to never trust a
      // cached copy of those fields — the DB is the single source of truth.
      // Same rule here: one extra indexed lookup whenever a session is read
      // is a small, worthwhile price for the JWT never going stale.
      const email = user?.email ?? (token.email as string | undefined);
      if (!email) return token;

      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.clientId = dbUser.clientId;
          token.role = dbUser.role as UserRole;
        }
      } catch (err) {
        console.error("[NextAuth] Non-fatal DB lookup error in jwt callback, preserving token state:", err);
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
});
