/** One row from GET /api/team — an accepted member or a pending invite. */
export interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: "OWNER" | "MARKETING_DIRECTOR" | "MEMBER";
  invited_at: string;
  accepted_at: string | null;
  status: "ACTIVE" | "PENDING";
}

/** One row from GET /api/team/workspaces — a workspace the user belongs to. */
export interface Workspace {
  client_id: string;
  name: string;
  slug: string;
  role: "OWNER" | "MARKETING_DIRECTOR" | "MEMBER";
  active: boolean;
}
