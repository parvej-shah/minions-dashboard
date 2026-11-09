import { Home, Lightbulb, LayoutGrid, Palette, type LucideIcon } from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Other paths that belong to this place (the review screen lives under Posts). */
  also?: string[];
  /** Which nav count shows as a badge, e.g. posts waiting for the reviewer. */
  badge?: "pendingReview";
}

/** The four places in the top menu (calm redesign, tasks/20-21). Everything else lives under the avatar. */
export function buildNavItems(): NavItem[] {
  return [
    { name: "Today", href: "/", icon: Home },
    { name: "Ideas", href: "/ideas", icon: Lightbulb },
    { name: "Posts", href: "/posts", icon: LayoutGrid, also: ["/editorial", "/published", "/drafts"], badge: "pendingReview" },
    { name: "Brand", href: "/brand", icon: Palette },
  ];
}

/** Whether `pathname` is inside this place. */
export function isNavActive(item: NavItem, pathname: string): boolean {
  const roots = [item.href, ...(item.also ?? [])];
  return roots.some((r) => (r === "/" ? pathname === "/" : pathname === r || pathname.startsWith(`${r}/`)));
}
