import { ImageResponse } from "next/og";
import { satoriFonts } from "./fonts";
import { COVER_SIZE, coverElement, type CoverSpec } from "./layouts";

/** Renders a cover to PNG. Throws CoverFitError when the copy cannot fit. */
export async function renderCoverPng(spec: CoverSpec): Promise<Buffer> {
  // coverElement runs every fit, so a CoverFitError throws here, before any drawing.
  const element = coverElement(spec);
  const res = new ImageResponse(element, { ...COVER_SIZE, fonts: satoriFonts() });
  return Buffer.from(await res.arrayBuffer());
}
