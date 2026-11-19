import satori from "satori";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/server/http/errors";
import { fit } from "@/lib/covers/fit";
import { COVER_FONTS, COVER_FONT_IDS, isCoverFont, satoriFonts, withCoverFont, faceStyle, type CoverFontId } from "@/lib/covers/fonts";

const SAMPLE = { width: 480, height: 160 } as const;
const samples = new Map<CoverFontId, string>();

/**
 * One small sample per cover font ("Hire faster" set in it), as the SVG
 * Satori draws: the letters are shapes, so the browser shows the real face
 * without loading any font. Drawn once per server.
 */
export async function coverFontSamples(): Promise<{ id: CoverFontId; label: string; about: string; svg: string }[]> {
  return Promise.all(
    COVER_FONT_IDS.map(async (id) => {
      let svg = samples.get(id);
      if (!svg) {
        svg = await withCoverFont(id, () => {
          // One line in every font: wide faces (Unbounded, Syne) are set smaller.
          const size = fit("Hire faster", 40, 110, { face: "serif", maxWidth: SAMPLE.width - 40, maxLines: 1, tracking: -0.02 })?.size ?? 40;
          return satori(
            { type: "div", props: { style: { display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", ...faceStyle("serif"), fontSize: size, letterSpacing: -0.02 * size, color: "#111111" }, children: "Hire faster" } } as never,
            { ...SAMPLE, fonts: satoriFonts() as never }
          );
        });
        samples.set(id, svg);
      }
      return { id, label: COVER_FONTS[id].label, about: COVER_FONTS[id].about, svg };
    })
  );
}

/** Saves the workspace's cover font beside the other cover settings in visualAssets. New covers use it. */
export async function setCoverFont(clientId: string, font: unknown): Promise<CoverFontId> {
  if (!isCoverFont(font)) throw new HttpError(422, `Pick one of: ${COVER_FONT_IDS.join(", ")}.`);
  const profile = await prisma.brandProfile.findUnique({ where: { clientId }, select: { visualAssets: true } });
  if (!profile) throw new HttpError(404, "The workspace has no brand profile.");
  const current = (profile.visualAssets ?? {}) as Record<string, unknown>;
  await prisma.brandProfile.update({ where: { clientId }, data: { visualAssets: { ...current, cover_font: font } } });
  return font;
}
