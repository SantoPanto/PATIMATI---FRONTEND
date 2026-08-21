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
 * Also cleans any accidental leading slashes before an absolute URL (e.g. `/https://...` -> `https://...`).
 * 
 * Relative Paths:
 * Combines `mediaBaseUrl` (without trailing slashes) and `cleanPath` (without leading slashes)
 * ensuring no leading slash is prepended to an absolute base URL.
 */
export function getImageUrl(path?: string | null): string {
  if (!path || typeof path !== "string" || !path.trim()) {
    return FALLBACK_IMAGE;
  }

  const trimmed = path.trim();

  // Strip any accidental leading slashes to check for absolute URL
  const sanitizedPath = trimmed.replace(/^\/+/, "");

  // Guard Clause: Absolute external URL or data/blob URI (e.g. https://... or http://...)
  if (/^(https?:\/\/|data:|blob:)/i.test(sanitizedPath)) {
    return sanitizedPath;
  }

  // Media / API Base URL configuration
  const rawBaseUrl = (
    import.meta.env.VITE_MEDIA_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://media.patimati.me"
  ).trim();

  // Clean trailing slashes from base URL and leading slashes from path
  const cleanBase = rawBaseUrl.replace(/\/+$/, "");

  return `${cleanBase}/${sanitizedPath}`;
}

/**
 * Alias for getImageUrl to support getMediaUrl naming convention.
 */
export const getMediaUrl = getImageUrl;
