import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  isPlatformAdminNavActive,
  filterTenants,
  filterUsers,
  filterWorkspaces,
  type TenantItem,
  type UserItem,
  type WorkspaceItem,
} from "@/lib/admin/adminNav";

describe("Platform Admin Navigation & Utilities (Task 117)", () => {
  describe("isPlatformAdminNavActive", () => {
    it("matches Tenants for root platform-admin and tenant detail pages", () => {
      expect(isPlatformAdminNavActive("/platform-admin", "/platform-admin")).toBe(true);
      expect(isPlatformAdminNavActive("/platform-admin", "/platform-admin/tenants/cm123")).toBe(true);
      expect(isPlatformAdminNavActive("/platform-admin", "/platform-admin/users")).toBe(false);
      expect(isPlatformAdminNavActive("/platform-admin", "/platform-admin/automations")).toBe(false);
    });

    it("matches Users only on users paths", () => {
      expect(isPlatformAdminNavActive("/platform-admin/users", "/platform-admin/users")).toBe(true);
      expect(isPlatformAdminNavActive("/platform-admin/users", "/platform-admin")).toBe(false);
      expect(isPlatformAdminNavActive("/platform-admin/users", "/platform-admin/automations")).toBe(false);
    });

    it("matches Automations only on automations paths", () => {
      expect(isPlatformAdminNavActive("/platform-admin/automations", "/platform-admin/automations")).toBe(true);
      expect(isPlatformAdminNavActive("/platform-admin/automations", "/platform-admin")).toBe(false);
      expect(isPlatformAdminNavActive("/platform-admin/automations", "/platform-admin/users")).toBe(false);
    });
  });

  describe("filterTenants", () => {
    const mockTenants: TenantItem[] = [
      {
        id: "t-1",
        name: "Acme Real Estate",
        slug: "acme-re",
        status: "ACTIVE",
        created_at: "2026-11-10T00:00:00Z",
        plan_key: "starter",
        subscription_status: "active",
        current_period_end: null,
        member_count: 3,
        asset_count: 15,
        total_cost_usd: 12.5,
      },
      {
        id: "t-2",
        name: "Beta Labs",
        slug: "beta-labs",
        status: "TRIAL",
        created_at: "2026-11-15T00:00:00Z",
        plan_key: "growth",
        subscription_status: "trialing",
        current_period_end: null,
        member_count: 1,
        asset_count: 5,
        total_cost_usd: 2.1,
      },
      {
        id: "t-3",
        name: "Zeta Dental",
        slug: "zeta-dental",
        status: "PAST_DUE",
        created_at: "2026-11-01T00:00:00Z",
        plan_key: "starter",
        subscription_status: "past_due",
        current_period_end: null,
        member_count: 2,
        asset_count: 40,
        total_cost_usd: 35.0,
      },
    ];

    it("returns all tenants when query is empty and status is ALL", () => {
      const result = filterTenants(mockTenants, "", "ALL", "newest");
      expect(result).toHaveLength(3);
    });

    it("filters by search query matching name or slug", () => {
      const byName = filterTenants(mockTenants, "acme", "ALL", "newest");
      expect(byName).toHaveLength(1);
      expect(byName[0].slug).toBe("acme-re");

      const bySlug = filterTenants(mockTenants, "beta-labs", "ALL", "newest");
      expect(bySlug).toHaveLength(1);
      expect(bySlug[0].id).toBe("t-2");
    });

    it("filters by status", () => {
      const activeOnly = filterTenants(mockTenants, "", "ACTIVE", "newest");
      expect(activeOnly).toHaveLength(1);
      expect(activeOnly[0].id).toBe("t-1");

      const pastDue = filterTenants(mockTenants, "", "PAST_DUE", "newest");
      expect(pastDue).toHaveLength(1);
      expect(pastDue[0].id).toBe("t-3");
    });

    it("sorts by spend, assets, members, and name", () => {
      const bySpend = filterTenants(mockTenants, "", "ALL", "spend");
      expect(bySpend[0].id).toBe("t-3"); // 35.0
      expect(bySpend[1].id).toBe("t-1"); // 12.5

      const byAssets = filterTenants(mockTenants, "", "ALL", "assets");
      expect(byAssets[0].id).toBe("t-3"); // 40
      expect(byAssets[2].id).toBe("t-2"); // 5

      const byMembers = filterTenants(mockTenants, "", "ALL", "members");
      expect(byMembers[0].id).toBe("t-1"); // 3

      const byName = filterTenants(mockTenants, "", "ALL", "name");
      expect(byName[0].name).toBe("Acme Real Estate");
      expect(byName[2].name).toBe("Zeta Dental");
    });
  });

  describe("filterUsers", () => {
    const mockUsers: UserItem[] = [
      {
        id: "u-1",
        email: "admin@minions.ai",
        name: "Admin Staff",
        role: "SYSTEM_ADMIN",
        client_id: null,
        client_name: null,
        client_slug: null,
        created_at: "2026-11-01T00:00:00Z",
      },
      {
        id: "u-2",
        email: "alice@acme.com",
        name: "Alice Owner",
        role: "OWNER",
        client_id: "t-1",
        client_name: "Acme Real Estate",
        client_slug: "acme-re",
        created_at: "2026-11-05T00:00:00Z",
      },
      {
        id: "u-3",
        email: "bob@acme.com",
        name: "Bob Marketer",
        role: "MEMBER",
        client_id: "t-1",
        client_name: "Acme Real Estate",
        client_slug: "acme-re",
        created_at: "2026-11-10T00:00:00Z",
      },
    ];

    it("filters users by query across name, email, or client name", () => {
      const byEmail = filterUsers(mockUsers, "admin@", "ALL");
      expect(byEmail).toHaveLength(1);
      expect(byEmail[0].role).toBe("SYSTEM_ADMIN");

      const byClient = filterUsers(mockUsers, "acme", "ALL");
      expect(byClient).toHaveLength(2);
    });

    it("filters users by role", () => {
      const admins = filterUsers(mockUsers, "", "SYSTEM_ADMIN");
      expect(admins).toHaveLength(1);
      expect(admins[0].id).toBe("u-1");

      const members = filterUsers(mockUsers, "", "MEMBER");
      expect(members).toHaveLength(1);
      expect(members[0].id).toBe("u-3");
    });
  });

  describe("filterWorkspaces", () => {
    const mockWorkspaces: WorkspaceItem[] = [
      {
        client_id: "w-1",
        name: "Acme Real Estate",
        slug: "acme-re",
        status: "ACTIVE",
        drafting_on: true,
        require_review: true,
      },
      {
        client_id: "w-2",
        name: "Beta Autopilot",
        slug: "beta-auto",
        status: "ACTIVE",
        drafting_on: true,
        require_review: false,
      },
      {
        client_id: "w-3",
        name: "Paused Workspace",
        slug: "paused",
        status: "ACTIVE",
        drafting_on: false,
        require_review: true,
      },
    ];

    it("filters workspaces by query", () => {
      const result = filterWorkspaces(mockWorkspaces, "beta", "ALL");
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("beta-auto");
    });

    it("filters by drafting status and autopilot", () => {
      const draftingOn = filterWorkspaces(mockWorkspaces, "", "DRAFTING_ON");
      expect(draftingOn).toHaveLength(2);

      const draftingOff = filterWorkspaces(mockWorkspaces, "", "DRAFTING_OFF");
      expect(draftingOff).toHaveLength(1);
      expect(draftingOff[0].client_id).toBe("w-3");

      const autopilot = filterWorkspaces(mockWorkspaces, "", "AUTOPILOT");
      expect(autopilot).toHaveLength(1);
      expect(autopilot[0].client_id).toBe("w-2");
    });
  });

  describe("Admin Visibility & UI Verification", () => {
    it("TopNav includes platform-admin quick link for SYSTEM_ADMIN", () => {
      const topNavSrc = fs.readFileSync(
        path.resolve(process.cwd(), "src/components/layout/TopNav.tsx"),
        "utf-8"
      );
      expect(topNavSrc).toContain("platform-admin");
    });

    it("AccountMenu emphasizes Platform admin with badge/styling", () => {
      const accountMenuSrc = fs.readFileSync(
        path.resolve(process.cwd(), "src/components/layout/AccountMenu.tsx"),
        "utf-8"
      );
      expect(accountMenuSrc).toContain("/platform-admin");
      expect(accountMenuSrc).toContain("SYSTEM_ADMIN");
    });

    it("Platform Admin layout uses modernized Post Studio branding and navigation", () => {
      const layoutSrc = fs.readFileSync(
        path.resolve(process.cwd(), "src/app/(platform-admin)/layout.tsx"),
        "utf-8"
      );
      expect(layoutSrc).toContain("PlatformAdminNav");
      expect(layoutSrc).toContain("post-studio-wordmark.png");
      expect(layoutSrc).toContain("Back to Post Studio");
      expect(layoutSrc).not.toContain("← Back to Cockpit");
    });

    it("Tenants directory page provides search, status filters, sorting and support session action", () => {
      const pageSrc = fs.readFileSync(
        path.resolve(process.cwd(), "src/app/(platform-admin)/platform-admin/page.tsx"),
        "utf-8"
      );
      expect(pageSrc).toContain("filterTenants");
      expect(pageSrc).toContain("Search by name, slug, or ID");
      expect(pageSrc).toContain("STATUS_FILTERS");
      expect(pageSrc).toContain("viewAsTenant");
      expect(pageSrc).toContain("/api/platform-admin/impersonate");
      expect(pageSrc).toContain("Newest first");
      expect(pageSrc).toContain("Highest spend");
    });

    it("Users directory page provides search, role filters, and staff indicators", () => {
      const usersSrc = fs.readFileSync(
        path.resolve(process.cwd(), "src/app/(platform-admin)/platform-admin/users/page.tsx"),
        "utf-8"
      );
      expect(usersSrc).toContain("filterUsers");
      expect(usersSrc).toContain("ROLE_FILTERS");
      expect(usersSrc).toContain("Platform Staff");
      expect(usersSrc).toContain("initial");
    });

    it("Automations page tracks dispatcher status and provides workspace drafting filters", () => {
      const autoSrc = fs.readFileSync(
        path.resolve(process.cwd(), "src/app/(platform-admin)/platform-admin/automations/page.tsx"),
        "utf-8"
      );
      expect(autoSrc).toContain("00b_posting_scheduler_dispatcher");
      expect(autoSrc).toContain("filterWorkspaces");
      expect(autoSrc).toContain("WORKSPACE_FILTERS");
      expect(autoSrc).toContain("DRAFTING_ON");
      expect(autoSrc).toContain("AUTOPILOT");
    });

    it("Tenant Detail page features tabbed navigation, direct support view-as, and usage cap editor", () => {
      const detailSrc = fs.readFileSync(
        path.resolve(process.cwd(), "src/app/(platform-admin)/platform-admin/tenants/[id]/page.tsx"),
        "utf-8"
      );
      expect(detailSrc).toContain("activeTab");
      expect(detailSrc).toContain("viewAsTenant");
      expect(detailSrc).toContain("saveOverride");
      expect(detailSrc).toContain("Clear override");
      expect(detailSrc).toContain("Overview & Quota");
      expect(detailSrc).toContain("Assets (");
      expect(detailSrc).toContain("Pipeline Runs (");
      expect(detailSrc).toContain("Ideas (");
      expect(detailSrc).toContain("Blog (");
    });

    it("ImpersonationBanner links directly to the active tenant in platform admin", () => {
      const bannerSrc = fs.readFileSync(
        path.resolve(process.cwd(), "src/components/layout/ImpersonationBanner.tsx"),
        "utf-8"
      );
      expect(bannerSrc).toContain("/platform-admin/tenants/");
      expect(bannerSrc).toContain("Exit session");
    });
  });
});
