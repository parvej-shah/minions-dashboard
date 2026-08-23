import {
  BarChart3,
  Bot,
  CreditCard,
  FileText,
  Globe,
  LayoutDashboard,
  Palette,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { NavCounts } from "@/types";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
}

/** Sidebar destinations, with live counts folded into their badges. */
export function buildNavItems(counts: NavCounts | null): NavItem[] {
  return [
    {
      name: "Mission Control",
      href: "/",
      icon: LayoutDashboard,
      badge: "Live",
      badgeColor: "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/30",
    },
    {
      name: "Idea Stream",
      href: "/ideas",
      icon: Sparkles,
      badge: counts ? `${counts.ideasReady} Ready` : undefined,
      badgeColor: "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/30",
    },
    {
      name: "Editorial Studio",
      href: "/editorial",
      icon: FileText,
      badge: counts ? `${counts.pendingReview} Review` : undefined,
      badgeColor: "bg-[#ff6b4a]/10 text-[#ff6b4a] border-[#ff6b4a]/30",
    },
    {
      name: "Published Posts",
      href: "/published",
      icon: Globe,
      badge: counts ? `${counts.publishedLive} Live` : undefined,
      badgeColor: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30",
    },
    {
      name: "Brand & Directives",
      href: "/brand",
      icon: Palette,
      badge: counts ? `${counts.directivesCount} Directives` : undefined,
      badgeColor: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30",
    },
    {
      name: "Content Performance",
      href: "/telemetry",
      icon: BarChart3,
    },
    {
      name: "Agent Fleet",
      href: "/fleet",
      icon: Bot,
      badge: counts ? `${counts.activeAgents} Active` : undefined,
      badgeColor: "bg-[#00C9A7]/10 text-[#00C9A7] border-[#00C9A7]/30",
    },
    {
      name: "Team",
      href: "/settings/team",
      icon: Users,
    },
    {
      name: "Billing",
      href: "/settings/billing",
      icon: CreditCard,
    },
  ];
}
