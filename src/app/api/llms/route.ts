import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { COMPACT_SPEC } from "@/constants/llmsSpec";
import { route } from "@/server/http/route";

export const dynamic = "force-dynamic";

const FULL_SPEC_PATH = path.join(process.cwd(), "public", "llms-full.txt");

export const GET = route({ auth: "public", failure: "Failed to load the spec" }, async ({ request }) => {
  const wantsFull = new URL(request.url).searchParams.get("full") === "true";
  const content = wantsFull ? await readFile(FULL_SPEC_PATH, "utf8").catch(() => COMPACT_SPEC) : COMPACT_SPEC;
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
});
