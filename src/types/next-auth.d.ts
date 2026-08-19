import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/constants/access";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}
