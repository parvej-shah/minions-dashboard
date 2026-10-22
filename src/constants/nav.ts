import {
  CreditCard,
  SlidersHorizontal,
  FileText,
  Globe,
  LayoutDashboard,
  Palette,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
}

/** Sidebar destinations. */
export function buildNavItems(): NavItem[] {
  return [
    {
      name: "Mission Control",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Idea Stream",
      href: "/ideas",
      icon: Sparkles,
    },
    {
      name: "Editorial Studio",
      href: "/editorial",
      icon: FileText,
    },
    {
      name: "Published Posts",
      href: "/published",
      icon: Globe,
    },
    {
      name: "Brand & Directives",
      href: "/brand",
      icon: Palette,
    },
    {
      name: "Channels",
      href: "/fleet",
      icon: SlidersHorizontal,
    },
    {
      name: "Billing",
      href: "/settings/billing",
      icon: CreditCard,
    },
  ];
}
