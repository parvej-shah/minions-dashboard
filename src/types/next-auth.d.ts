import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/constants/access";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      clientId: string | null;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    clientId?: string | null;
    role?: UserRole;
  }
}
