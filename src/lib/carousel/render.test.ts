import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { slideJpeg } from "./render";

describe("carousel page images", () => {
  it("turns a slide PNG into a JPEG of the same size", async () => {
    const png = await sharp({ create: { width: 1080, height: 1350, channels: 4, background: { r: 255, g: 248, b: 240, alpha: 1 } } }).png().toBuffer();
    const jpg = await slideJpeg(png);
    const meta = await sharp(jpg).metadata();
    expect(meta.format).toBe("jpeg");
    expect([meta.width, meta.height]).toEqual([1080, 1350]);
  });
});
