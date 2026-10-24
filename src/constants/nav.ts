import {
  CreditCard,
  FileText,
  Globe,
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
      name: "Brand",
      href: "/brand",
      icon: Palette,
    },
    {
      name: "Published Posts",
      href: "/published",
      icon: Globe,
    },
    {
      name: "Billing",
      href: "/settings/billing",
      icon: CreditCard,
    },
  ];
}
