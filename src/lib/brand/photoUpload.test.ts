import { describe, expect, it } from "vitest";
import {
  validateCoverPhoto,
  updatePhotoPayload,
  validateCutoutPhoto,
  updateCutoutPayload,
} from "./photoUpload";
import type { BrandSettings } from "@/types";

describe("Cover Photo Upload Validation", () => {
  it("accepts valid PNG and JPEG files under 5MB", () => {
    const validPng = { type: "image/png", size: 1024 * 1024 } as File;
    const validJpg = { type: "image/jpeg", size: 2 * 1024 * 1024 } as File;
    expect(validateCoverPhoto(validPng)).toBeNull();
    expect(validateCoverPhoto(validJpg)).toBeNull();
  });

  it("rejects non-PNG/JPEG types", () => {
    const webp = { type: "image/webp", size: 1024 * 1024 } as File;
    expect(validateCoverPhoto(webp)).toBe("Use a PNG or JPEG image.");
  });

  it("rejects files larger than 5MB", () => {
    const large = { type: "image/jpeg", size: 6 * 1024 * 1024 } as File;
    expect(validateCoverPhoto(large)).toBe("Use an image under 5 MB.");
  });

  it("updates photo payload with new url and keeps other fields", () => {
    const mockProfile = {
      brand_name: "Minions",
      primary_logo_url: "https://old.jpg",
      primary_ink: "#111111",
      brand_teal: "#222222",
      brand_coral: "#333333",
      brand_cream: "#444444",
      accent_blue: null,
      cover_byline: "Founder",
      cover_art: "SHAPES",
      cover_cutout_url: "https://old-cutout.png",
      tone_guidelines: {
        formality: "casual",
        cadence: "weekly",
        allowed_proof_claims: [],
      },
    } as unknown as BrandSettings;

    const updated = updatePhotoPayload(mockProfile, "https://new.jpg");
    expect(updated.primary_logo_url).toBe("https://new.jpg");
    expect(updated.cover_cutout_url).toBe("https://old-cutout.png");
    expect(updated.brand_name).toBe("Minions");

    const removed = updatePhotoPayload(mockProfile, "");
    expect(removed.primary_logo_url).toBe("");
  });
});

describe("Cut-out Photo Upload Validation", () => {
  it("accepts valid PNG files under 5MB", () => {
    const validPng = { type: "image/png", size: 2 * 1024 * 1024 } as File;
    expect(validateCutoutPhoto(validPng)).toBeNull();
  });

  it("rejects non-PNG files", () => {
    const jpg = { type: "image/jpeg", size: 1024 * 1024 } as File;
    expect(validateCutoutPhoto(jpg)).toBe("Use a PNG with a transparent background.");
  });

  it("rejects files larger than 5MB", () => {
    const large = { type: "image/png", size: 6 * 1024 * 1024 } as File;
    expect(validateCutoutPhoto(large)).toBe("Use an image under 5 MB.");
  });

  it("updates cutout payload with new url and keeps other fields", () => {
    const mockProfile = {
      brand_name: "Minions",
      primary_logo_url: "https://photo.jpg",
      cover_cutout_url: "https://old-cutout.png",
      tone_guidelines: {
        formality: "casual",
        cadence: "weekly",
        allowed_proof_claims: [],
      },
    } as unknown as BrandSettings;

    const updated = updateCutoutPayload(mockProfile, "https://new-cutout.png");
    expect(updated.cover_cutout_url).toBe("https://new-cutout.png");
    expect(updated.primary_logo_url).toBe("https://photo.jpg");

    const removed = updateCutoutPayload(mockProfile, "");
    expect(removed.cover_cutout_url).toBe("");
  });
});
