"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, Cpu } from "lucide-react";
import { isPlatformAdminNavActive } from "@/lib/admin/adminNav";

const NAV_ITEMS = [
  { href: "/platform-admin", label: "Tenants", icon: Building2 },
  { href: "/platform-admin/users", label: "Users", icon: Users },
  { href: "/platform-admin/automations", label: "Automations", icon: Cpu },
];

export function PlatformAdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Platform Admin" className="flex items-center gap-1 bg-surface-2/70 p-1 rounded-full border border-line/60">
      {NAV_ITEMS.map((item) => {
        const active = isPlatformAdminNavActive(item.href, pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              active
                ? "bg-surface font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-line/50"
                : "text-muted hover:text-ink hover:bg-surface/50"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${active ? "text-brand" : "text-subtle"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
