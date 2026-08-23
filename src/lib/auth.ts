import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
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
    async jwt({ token, user, trigger }) {
      // `user` is only present on the sign-in request itself, so the DB
      // lookup normally happens once per session, not once per request.
      // `trigger === "update"` is the exception: the onboarding wizard calls
      // the client-side `update()` from useSession() right after attaching a
      // Client to this user (see /api/onboarding/client), specifically to
      // force this callback to re-run and pick up the new clientId — without
      // it the JWT would keep serving the stale clientId: null it was issued
      // with at sign-in, for the rest of the session's lifetime.
      const email = user?.email ?? (token.email as string | undefined);
      if ((user?.email || trigger === "update") && email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() },
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
