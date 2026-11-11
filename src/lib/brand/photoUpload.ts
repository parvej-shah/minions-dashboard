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
