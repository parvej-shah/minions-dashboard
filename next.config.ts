import type { NextConfig } from "next";

// Every cover-image <Image> currently passes `unoptimized`, which skips this
// allowlist entirely -- but that's a landmine: the moment `unoptimized` is
// dropped anywhere to get real image optimization, next/image throws for any
// hostname not listed here. R2's public dev domain was never added.
const r2PublicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
const r2Hostname = r2PublicDomain ? new URL(r2PublicDomain).hostname : null;

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@prisma/client", "pg", "@prisma/adapter-pg"],
  images: {
    remotePatterns: [
      ...(r2Hostname ? [{ protocol: "https" as const, hostname: r2Hostname }] : []),
      { protocol: "https" as const, hostname: "*.r2.dev" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/llms.txt",
        destination: "/api/llms",
      },
      {
        source: "/llms-full.txt",
        destination: "/api/llms?full=true",
      },
    ];
  },
};

export default nextConfig;
