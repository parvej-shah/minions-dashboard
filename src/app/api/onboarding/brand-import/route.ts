import { prepareBrandImport, runBrandImport } from "@/services/brandImport";
import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";
import { ndjsonResponse } from "@/server/http/stream";
import type { ImportEvent } from "@/lib/brandImport/types";

// Three model reads run in parallel after the website is read; ~15s typical.
export const maxDuration = 90;

export const POST = route({ auth: "provision", failure: "Failed to read your profile" }, async ({ clientId, request }) => {
  const input = await prepareBrandImport(clientId, await readJson(request), "onboarding");
  return ndjsonResponse<ImportEvent>(
    (emit) => runBrandImport(clientId, input, emit),
    () => ({ type: "error", message: "Something went wrong while reading. Please try again." })
  );
});
