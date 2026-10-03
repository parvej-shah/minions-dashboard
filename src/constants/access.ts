export type UserRole = "OWNER" | "MARKETING_DIRECTOR" | "MEMBER" | "SYSTEM_ADMIN";

export const ASSIGNABLE_ROLES: readonly UserRole[] = ["OWNER", "MARKETING_DIRECTOR", "MEMBER"];

export const canManageTeam = (role: UserRole) => role === "OWNER" || role === "MARKETING_DIRECTOR";
