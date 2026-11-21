import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Shield } from "lucide-react";
import { getCurrentUser, isPlatformStaff } from "@/lib/tenant";
import { PlatformAdminNav } from "@/components/admin/PlatformAdminNav";

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
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/platform-admin" className="flex items-center gap-2.5">
              <Image
                src="/images/post-studio-wordmark.png"
                alt="Minions Post Studio"
                width={1051}
                height={147}
                priority
                className="h-[15px] w-auto"
              />
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand/10 text-brand border border-brand/20">
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </span>
            </Link>

            <div className="hidden sm:block">
              <PlatformAdminNav />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-block text-xs font-mono text-muted bg-surface-2 px-2.5 py-1 rounded-lg border border-line">
              {user.email}
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface hover:bg-surface-2 border border-line text-ink transition-all shadow-sm"
            >
              <span>Back to Post Studio</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted" />
            </Link>
          </div>
        </div>

        {/* Mobile secondary bar for navigation */}
        <div className="sm:hidden border-t border-line/60 bg-surface/50 px-4 py-2 flex justify-center">
          <PlatformAdminNav />
        </div>
      </header>
      <main className="p-4 sm:p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
