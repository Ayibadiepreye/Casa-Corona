/**
 * Client-side image upload helper with enforced size/type limits.
 *
 * Defaults: 5MB max per file, image/* only. Centralized so every upload UI
 * uses the same validation rules (no bypassing the 5MB cap).
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export type ImageValidationError =
  | { ok: true; file: File }
  | { ok: false; reason: string };

export function validateImage(file: File, maxBytes = MAX_IMAGE_BYTES): ImageValidationError {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      ok: false,
      reason: `Unsupported file type: ${file.type || "unknown"}. Use JPG, PNG, WebP, GIF, or AVIF.`,
    };
  }
  if (file.size > maxBytes) {
    return {
      ok: false,
      reason: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max is ${maxBytes / 1024 / 1024}MB.`,
    };
  }
  return { ok: true, file };
}

export function validateImages(files: File[], maxBytes = MAX_IMAGE_BYTES): { ok: boolean; files: File[]; errors: string[] } {
  const errors: string[] = [];
  const ok: File[] = [];
  for (const f of files) {
    const r = validateImage(f, maxBytes);
    if (r.ok) ok.push(r.file);
    else errors.push(r.reason);
  }
  return { ok: errors.length === 0, files: ok, errors };
}

/** Convenience: attaches `accept` attribute for <input type="file"> */
export const IMAGE_INPUT_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");
