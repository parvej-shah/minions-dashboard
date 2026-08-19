import DashboardShell from "@/components/layout/DashboardShell";

/**
 * Wraps every authenticated dashboard route in the app chrome.
 *
 * The shell used to decide this itself by returning early when the pathname was
 * /login — before it had called its hooks. Route groups express the same
 * intent without a conditional hook order.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
