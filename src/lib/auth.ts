import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { requireOneOfEnv } from "./env";
import { ADMIN_WHITELIST_EMAILS, resolveUserRole } from "@/constants/access";

export { ADMIN_WHITELIST_EMAILS as WHITELIST_EMAILS };

export const { handlers, auth, signIn, signOut } = NextAuth({
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

      // Strict whitelist authorization
      if (!ADMIN_WHITELIST_EMAILS.includes(cleanEmail)) {
        console.warn(`[NextAuth] Unauthorized login attempt blocked for: ${cleanEmail}`);
        return false;
      }
      return true;
    },
    async session({ session, token }) {
      if (session?.user?.email) {
        session.user.role = resolveUserRole(session.user.email);
        session.user.id = token.sub ?? "admin-user";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
});
