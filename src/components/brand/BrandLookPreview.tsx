interface BrandLookPreviewColors {
  primary_ink: string;
  brand_teal: string;
  brand_coral: string;
  brand_cream: string;
  accent_blue: string;
}

interface BrandLookPreviewProps {
  colors: BrandLookPreviewColors;
  brandName?: string;
}

/**
 * Mocks the actual cover-thumbnail composition the pipeline generates
 * (see 02_idea_to_asset's "Parse Variants and Prepare Rows" node): cream
 * canvas, bold headline with one accent-color word, a small kicker line,
 * a small corner line-icon, and a small wordmark. Not the real AI render --
 * a live CSS approximation so a color change is visible before saving,
 * instead of five isolated swatches that don't say what the output looks like.
 */
export default function BrandLookPreview({ colors, brandName }: BrandLookPreviewProps) {
  const name = brandName?.trim() || "Your Brand";

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-[#94A3B8] block">Live thumbnail preview</label>
      <div
        className="w-full max-w-sm aspect-video rounded-lg border border-[#1F2D3D] relative overflow-hidden p-3 sm:p-4 flex flex-col justify-between transition-colors"
        style={{ backgroundColor: colors.brand_cream }}
      >
        {/* Wordmark, top-right */}
        <div className="flex justify-end">
          <span
            className="text-[10px] sm:text-xs font-bold tracking-tight truncate max-w-[60%]"
            style={{ color: colors.primary_ink }}
          >
            {name}
          </span>
        </div>

        {/* Headline block, left-aligned, dominant */}
        <div className="max-w-[65%] space-y-1">
          <p
            className="text-lg sm:text-2xl font-extrabold leading-[1.05] tracking-tight"
            style={{ color: colors.primary_ink }}
          >
            THIS IS YOUR{" "}
            <span style={{ color: colors.brand_coral }}>HEADLINE</span>
          </p>
          <p className="text-[9px] sm:text-[11px] font-medium" style={{ color: `${colors.primary_ink}99` }}>
            A short one-line subtitle goes here.
          </p>
        </div>

        {/* Small corner glyph, bottom-right */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8"
          style={{ color: colors.accent_blue }}
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Small teal accent dash, echoes the eyebrow/kicker tone */}
        <span
          className="absolute top-4 sm:top-6 left-4 sm:left-6 w-4 h-0.5 rounded-full"
          style={{ backgroundColor: colors.brand_teal }}
        />
      </div>
      <p className="text-[10px] text-[#64748B]">
        Approximate — the real cover is AI-generated and will vary in layout.
      </p>
    </div>
  );
}
