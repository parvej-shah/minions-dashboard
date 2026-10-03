import { route } from "@/server/http/route";

export const dynamic = "force-dynamic";

export const GET = route({ auth: "public", failure: "Version check failed" }, async () => ({
  status: "ok",
  version: "0.1.80-docs-public",
  timestamp: new Date().toISOString(),
}));
