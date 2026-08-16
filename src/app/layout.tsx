import type { Metadata } from "next";
import "./globals.css";
import DashboardShell from "@/components/layout/DashboardShell";

export const viewport = {
  themeColor: "#00C9A7",
};

export const metadata: Metadata = {
  title: "Minions.AI — Autonomous Agent Cockpit",
  description: "Executive Multi-Agent Orchestration, Editorial Staging & Omnichannel Broadcast Command Center",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" }
    ]
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-[#00C9A7]/20 selection:text-[#00C9A7] bg-[#070B0F] text-[#F1F5F9] min-h-screen">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
