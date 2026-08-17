import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const WHITELIST_EMAILS = [
  "parvejshahlabib007@gmail.com",
  "xpeedlab@gmail.com",
  "xbitlab@gmail.com",
  "parvej@getminions.ai",
  "rakib@getminions.ai"
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "minions-ai-production-auth-secret-key-2026",
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      const cleanEmail = user.email.trim().toLowerCase();
      
      // Strict Whitelist Authorization
      const isAllowed = WHITELIST_EMAILS.includes(cleanEmail);
      if (!isAllowed) {
        console.warn(`[NextAuth] Unauthorized login attempt blocked for: ${cleanEmail}`);
        return false;
      }
      return true;
    },
    async session({ session, token }) {
      if (session?.user && session.user.email) {
        const cleanEmail = session.user.email.toLowerCase();
        (session.user as any).role = cleanEmail.includes("parvej") ? "MARKETING_DIRECTOR" : "SYSTEM_ADMIN";
        (session.user as any).id = token.sub || "admin-user";
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
