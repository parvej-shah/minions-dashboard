import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isPlatformStaff } from "@/lib/tenant";

/**
 * Deliberately its own route group, not nested under (dashboard) --
 * DashboardShell's chrome (Sidebar, quota meter, workspace switcher) all
 * assume a tenant-scoped session via useNavCounts/useChannelSummary, which
 * platform staff can't call (they have no clientId). This gate is a second,
 * server-side check on top of proxy.ts's own auth gate, specific to the
 * `role === SYSTEM_ADMIN && clientId === null` condition proxy.ts doesn't
 * enforce (it only checks "signed in" and "has a clientId or is platform
 * staff", not "is *this* route platform-staff-only").
 */
export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || !isPlatformStaff(user)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#0a0d12] text-[#F1F5F9]">
      <header className="border-b border-[#1F2D3D] bg-[#0f1419] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/platform-admin" className="flex items-baseline">
            <span className="font-extrabold text-lg tracking-tight text-white">Minions</span>
            <span className="text-[#ff6b4a] font-bold text-lg ml-0.5">.AI</span>
            <span className="text-[#00C9A7] text-xs ml-2 font-mono font-semibold uppercase tracking-wider">
              Platform Admin
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-xs font-mono font-semibold">
            <Link href="/platform-admin" className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
              Tenants
            </Link>
            <Link href="/platform-admin/users" className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
              Users
            </Link>
            <Link href="/platform-admin/automations" className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
              Automations
            </Link>
          </nav>
        </div>
        <Link href="/" className="text-xs text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
          ← Back to Cockpit
        </Link>
      </header>
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
