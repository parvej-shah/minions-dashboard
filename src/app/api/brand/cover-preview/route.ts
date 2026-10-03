import { renderCoverPreview } from "@/services/cover";
import { asOptionalString, readJsonOrEmpty } from "@/server/http/body";
import { route } from "@/server/http/route";

export const maxDuration = 30;

const MAX_FIELD_LENGTH = 500;
const PREVIEW_FIELDS = [
  "brand_name",
  "primary_ink",
  "brand_cream",
  "brand_coral",
  "brand_teal",
  "cover_byline",
  "primary_logo_url",
  "positioning",
  "cover_art",
] as const;

// Renders with the Brand page's unsaved values; notes about replaced colours or an unreadable photo travel in X-Cover-Notes.
export const POST = route({ auth: "tenant", failure: "Failed to render the cover preview" }, async ({ clientId, request }) => {
  const body = await readJsonOrEmpty(request);
  const input = Object.fromEntries(PREVIEW_FIELDS.map((field) => [field, asOptionalString(body[field], MAX_FIELD_LENGTH)]));
  const { png, notes } = await renderCoverPreview(clientId, input);
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store", "X-Cover-Notes": encodeURIComponent(JSON.stringify(notes)) },
  });
});
