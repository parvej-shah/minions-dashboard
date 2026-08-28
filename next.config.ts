import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@prisma/client", "pg", "@prisma/adapter-pg"],
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
