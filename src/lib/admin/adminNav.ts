export interface TenantItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  plan_key: string;
  subscription_status: string | null;
  current_period_end: string | null;
  member_count: number;
  asset_count: number;
  total_cost_usd: number;
}

export interface UserItem {
  id: string;
  email: string;
  name: string | null;
  role: string;
  client_id: string | null;
  client_name: string | null;
  client_slug: string | null;
  created_at: string;
}

export interface WorkspaceItem {
  client_id: string;
  name: string;
  slug: string;
  status: string;
  drafting_on: boolean;
  require_review: boolean;
}

export function isPlatformAdminNavActive(href: string, currentPath: string): boolean {
  if (href === "/platform-admin") {
    return currentPath === "/platform-admin" || currentPath.startsWith("/platform-admin/tenants");
  }
  return currentPath.startsWith(href);
}

export function filterTenants(
  tenants: TenantItem[],
  query: string,
  statusFilter: string,
  sortBy: string
): TenantItem[] {
  const q = query.trim().toLowerCase();

  const filtered = tenants.filter((t) => {
    const matchesQuery =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" ||
      t.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesQuery && matchesStatus;
  });

  return filtered.sort((a, b) => {
    switch (sortBy) {
      case "spend":
        return b.total_cost_usd - a.total_cost_usd;
      case "assets":
        return b.asset_count - a.asset_count;
      case "members":
        return b.member_count - a.member_count;
      case "name":
        return a.name.localeCompare(b.name);
      case "newest":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
}

export function filterUsers(
  users: UserItem[],
  query: string,
  roleFilter: string
): UserItem[] {
  const q = query.trim().toLowerCase();

  return users.filter((u) => {
    const matchesQuery =
      !q ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      (u.client_name && u.client_name.toLowerCase().includes(q)) ||
      (u.client_slug && u.client_slug.toLowerCase().includes(q));

    const matchesRole =
      roleFilter === "ALL" || u.role.toUpperCase() === roleFilter.toUpperCase();

    return matchesQuery && matchesRole;
  });
}

export function filterWorkspaces(
  workspaces: WorkspaceItem[],
  query: string,
  filter: string
): WorkspaceItem[] {
  const q = query.trim().toLowerCase();

  return workspaces.filter((w) => {
    const matchesQuery =
      !q ||
      w.name.toLowerCase().includes(q) ||
      w.slug.toLowerCase().includes(q) ||
      w.client_id.toLowerCase().includes(q);

    if (!matchesQuery) return false;

    switch (filter) {
      case "DRAFTING_ON":
        return w.drafting_on;
      case "DRAFTING_OFF":
        return !w.drafting_on;
      case "REVIEW_REQUIRED":
        return w.require_review;
      case "AUTOPILOT":
        return !w.require_review;
      case "ALL":
      default:
        return true;
    }
  });
}
