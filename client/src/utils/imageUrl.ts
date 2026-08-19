/**
 * Image URL Utility / Helper
 * Provides central, safe image URL parsing and guard clauses for PatiMati frontend.
 * Follows Single Responsibility Principle (SRP) and DRY.
 */

const FALLBACK_IMAGE = "/favicon.svg";

/**
 * Transforms a given image path or URL into a safe, valid image URL.
 * 
 * Guard Clause:
 * If `path` starts with `http://` or `https://` (or `data:` / `blob:`),
 * returns it directly as-is without prepending any base path, current route prefix, or domain.
 * 
 * Relative Paths:
 * If `path` is a relative path or filename (e.g. `/uploads/...`),
 * prepends the configured media storage base domain if present, or ensures a root-relative path.
 */
export function getImageUrl(path?: string | null): string {
  if (!path || typeof path !== "string" || !path.trim()) {
    return FALLBACK_IMAGE;
  }

  const trimmed = path.trim();

  // Guard Clause: Absolute external URL or data/blob URI
  if (/^(https?:\/\/|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  // Media / API Base URL configuration
  const mediaBaseUrl = (
    import.meta.env.VITE_MEDIA_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    ""
  ).trim();

  if (trimmed.startsWith("/")) {
    return mediaBaseUrl ? `${mediaBaseUrl.replace(/\/+$/, "")}${trimmed}` : trimmed;
  }

  return mediaBaseUrl ? `${mediaBaseUrl.replace(/\/+$/, "")}/${trimmed}` : `/${trimmed}`;
}

/**
 * Alias for getImageUrl to support getMediaUrl naming convention.
 */
export const getMediaUrl = getImageUrl;
