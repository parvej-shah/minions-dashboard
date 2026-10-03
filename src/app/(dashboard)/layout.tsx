import DashboardShell from "@/components/layout/DashboardShell";

/** Wraps every authenticated dashboard route in the app chrome; the route group keeps /login outside it. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
