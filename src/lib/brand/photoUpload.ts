import type { BrandProfileInput, BrandSettings } from "@/types";
import { toProfileInput } from "@/lib/brandProfileInput";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_PHOTO_TYPES = ["image/png", "image/jpeg"];

/**
 * Validates an uploaded cover headshot or logo file.
 * Returns null if valid, or a friendly error message string.
 */
export function validateCoverPhoto(file: File | undefined): string | null {
  if (!file) return "No file selected.";
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return "Use a PNG or JPEG image.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "Use an image under 5 MB.";
  }
  return null;
}

/**
 * Prepares the BrandProfileInput payload with the new photo URL.
 */
export function updatePhotoPayload(profile: BrandSettings, photoUrl: string): BrandProfileInput {
  return {
    ...toProfileInput(profile),
    primary_logo_url: photoUrl,
  };
}

/**
 * Validates an uploaded cut-out file.
 * Returns null if valid, or a friendly error message string.
 */
export function validateCutoutPhoto(file: File | undefined): string | null {
  if (!file) return "No file selected.";
  if (file.type !== "image/png") {
    return "Use a PNG with a transparent background.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "Use an image under 5 MB.";
  }
  return null;
}

/**
 * Prepares the BrandProfileInput payload with the new cutout URL.
 */
export function updateCutoutPayload(profile: BrandSettings, cutoutUrl: string): BrandProfileInput {
  return {
    ...toProfileInput(profile),
    cover_cutout_url: cutoutUrl,
  };
}

/**
 * Checks whether a PNG's top corners are transparent (alpha <= 32).
 * Returns true if transparent or on browser fallback.
 */
export async function hasClearCorners(file: File): Promise<boolean> {
  if (typeof window === "undefined" || typeof createImageBitmap === "undefined") {
    return true;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;
    ctx.drawImage(bitmap, 0, 0, 64, 64);
    const alpha = (x: number) => ctx.getImageData(x, 0, 1, 1).data[3];
    return alpha(0) <= 32 && alpha(63) <= 32;
  } catch {
    return true;
  }
}
