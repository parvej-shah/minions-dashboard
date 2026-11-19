import { readJson } from "@/server/http/body";
import { route } from "@/server/http/route";
import { coverFontSamples, setCoverFont } from "@/services/coverFonts";

/** The cover fonts a workspace can pick, each with a small sample drawn in it. */
export const GET = route({ auth: "tenant", failure: "Could not load the fonts" }, async () => ({ fonts: await coverFontSamples() }));

/** Body: { font: id }. New covers and carousels use it; covers already made keep theirs. */
export const PATCH = route({ auth: "tenant", failure: "Could not change the font" }, async ({ clientId, request }) => {
  const body = await readJson(request);
  return { font: await setCoverFont(clientId, body.font) };
});
