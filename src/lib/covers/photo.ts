/**
 * Whether the author's image can fill the photo poster. The brand profile's
 * "logo" field holds a headshot for most people but a logo for some, and a
 * logo blown up to 1080 wide looks broken. A headshot is opaque, big enough
 * not to blur and about portrait-shaped; a logo usually has a transparent
 * background or is wide.
 */
export interface ImageInfo {
  width: number;
  height: number;
  /** PNG colour types 4 and 6 carry an alpha channel. */
  alpha: boolean;
}

/** Width, height and alpha from a PNG or JPEG header, or null for anything else. */
export function imageInfo(data: Buffer): ImageInfo | null {
  if (data.length > 26 && data.readUInt32BE(0) === 0x89504e47) {
    const colourType = data[25];
    // A tRNS chunk (always before the image data) can also make a PNG transparent.
    const trns = data.indexOf("tRNS");
    const idat = data.indexOf("IDAT");
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20), alpha: colourType === 4 || colourType === 6 || (trns > 0 && (idat < 0 || trns < idat)) };
  }
  if (data.length > 4 && data[0] === 0xff && data[1] === 0xd8) {
    let i = 2;
    while (i + 9 < data.length) {
      if (data[i] !== 0xff) return null;
      const marker = data[i + 1];
      const len = data.readUInt16BE(i + 2);
      // SOF0-SOF15 hold the size, except DHT (C4), JPG (C8) and DAC (CC).
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: data.readUInt16BE(i + 5), width: data.readUInt16BE(i + 7), alpha: false };
      }
      i += 2 + len;
    }
  }
  return null;
}

/** The shortest side a photo poster can use without blurring. */
export const PHOTO_MIN_SIDE = 600;

export function photoFitsPoster(info: ImageInfo | null): boolean {
  if (!info || info.alpha) return false;
  const ratio = info.height / info.width;
  return Math.min(info.width, info.height) >= PHOTO_MIN_SIDE && ratio >= 0.75 && ratio <= 1.8;
}

/** The same check on a data: URL, as the cover service holds the photo. */
export function dataUrlFitsPoster(dataUrl: string | undefined): boolean {
  const m = dataUrl?.match(/^data:image\/(?:png|jpeg);base64,(.+)$/);
  return Boolean(m) && photoFitsPoster(imageInfo(Buffer.from(m![1], "base64")));
}
