import { ImageResponse } from "next/og";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { satoriFonts, withCoverFont } from "@/lib/covers/fonts";
import { SLIDE_SIZE, slideElement, type Deck } from "./slides";

/** Renders slide i (0 is the cover) to PNG. Throws CoverFitError when its copy cannot fit. */
export function renderSlidePng(deck: Deck, i: number): Promise<Buffer> {
  return withCoverFont(deck.font ?? deck.cover.font, async () => {
    const element = slideElement(deck, i);
    const res = new ImageResponse(element, { ...SLIDE_SIZE, fonts: satoriFonts(i === 0 && deck.cover.layout === "CUSTOM") });
    return Buffer.from(await res.arrayBuffer());
  });
}

/** A slide PNG as a JPEG, the only image type Instagram's API takes. Same size. */
export async function slideJpeg(png: Buffer): Promise<Buffer> {
  return sharp(png).flatten({ background: "#ffffff" }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}

/**
 * The whole deck as one PDF, one slide per page at the slide's size, which is
 * what LinkedIn's document post shows as a carousel (D19). Every slide is
 * fitted before any is drawn, so a slide that cannot fit fails the deck early.
 */
export async function renderCarouselPdf(deck: Deck, pngs?: Buffer[]): Promise<Buffer> {
  const count = deck.slides.length + 1;
  for (let i = 0; i < count; i++) slideElement(deck, i);
  const pages = pngs ?? (await Promise.all(Array.from({ length: count }, (_, i) => renderSlidePng(deck, i))));
  const pdf = await PDFDocument.create();
  pdf.setTitle(deck.cover.headline);
  pdf.setAuthor(deck.author.name);
  for (const png of pages) {
    const image = await pdf.embedPng(png);
    pdf.addPage([SLIDE_SIZE.width, SLIDE_SIZE.height]).drawImage(image, { x: 0, y: 0, width: SLIDE_SIZE.width, height: SLIDE_SIZE.height });
  }
  return Buffer.from(await pdf.save());
}
