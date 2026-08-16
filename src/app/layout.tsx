import type { Metadata } from "next";
import "./globals.css";
import DashboardShell from "@/components/layout/DashboardShell";

export const metadata: Metadata = {
  title: "Minions.AI | Autonomous Agent Cockpit",
  description: "Mission control for autonomous marketing agents, editorial staging, Cloudflare R2 asset management, and omnichannel publication.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#faf9f6] text-[#12242a] antialiased">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
