/**
 * Tactile buttons for the story session: a thick bottom edge that the button
 * sinks into when pressed, like a physical key.
 */
const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-b-4 px-5 text-sm font-extrabold uppercase tracking-wider transition-[transform,border-width,background-color] duration-75 select-none cursor-pointer active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:border-b-4 focus-visible:outline-2 focus-visible:outline-offset-2";

export const chunky = {
  primary: `${base} bg-[#00C9A7] border-[#00917A] text-[#04201A] hover:bg-[#1AD8B6] focus-visible:outline-[#00C9A7] disabled:bg-[#1F2D3D] disabled:border-[#16202B] disabled:text-[#52627A]`,
  amber: `${base} bg-[#F59E0B] border-[#B45309] text-[#1F1300] hover:bg-[#FBB12E] focus-visible:outline-[#F59E0B]`,
  ghost: `${base} border-2 border-b-4 border-[#1F2D3D] bg-transparent text-[#94A3B8] hover:bg-[#131B24] hover:text-[#F1F5F9] focus-visible:outline-[#00C9A7]`,
  chip: "rounded-xl border-2 border-b-4 border-[#1F2D3D] bg-[#0F1419] px-3 py-2 text-sm font-semibold text-[#CBD5E1] transition-[transform,border-width] duration-75 cursor-pointer hover:border-[#2B3D52] active:translate-y-0.5 active:border-b-2",
};
