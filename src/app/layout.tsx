import type { Metadata, Viewport } from "next";
import "./globals.css";
import DashboardShell from "@/components/layout/DashboardShell";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export const viewport: Viewport = {
  themeColor: "#070B0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Minions.AI — Autonomous Agent Cockpit",
  description: "Executive Multi-Agent Orchestration, Editorial Staging & Omnichannel Broadcast Command Center",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Minions.AI",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
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
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Minions.AI" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="antialiased selection:bg-[#00C9A7]/20 selection:text-[#00C9A7] bg-[#070B0F] text-[#F1F5F9] min-h-screen">
        <AuthProvider>
          <DashboardShell>{children}</DashboardShell>
          <PwaRegister />
          <InstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
