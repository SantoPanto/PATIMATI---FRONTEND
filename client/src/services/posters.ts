import { ApiError, API_BASE_URL } from "./api";
import { getStoredToken } from "./authStorage";

const LOST_POSTER_ENDPOINT =
  import.meta.env.VITE_LOST_POSTER_ENDPOINT || "/api/v1/ads/{id}/poster";

function resolveEndpoint(template: string, id: number): string {
  return template.replace("{id}", encodeURIComponent(String(id)));
}

function getDownloadFileName(
  contentDisposition: string | null,
  adId: number,
): string {
  if (contentDisposition) {
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1].replace(/["']/g, ""));
      } catch {
        // Geçersiz header varsa varsayılan dosya adına düş.
      }
    }

    const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);

    if (basicMatch?.[1]) {
      return basicMatch[1].trim();
    }
  }

  return `kayip-afisi-${adId}.pdf`;
}

async function getErrorData(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => "");

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

function getErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const errorData = data as Record<string, unknown>;

    const candidates = [
      errorData.message,
      errorData.detail,
      errorData.error,
      errorData.title,
    ];

    const message = candidates.find(
      (candidate): candidate is string =>
        typeof candidate === "string" && candidate.trim().length > 0,
    );

    if (message) {
      return message;
    }
  }

  if (status === 404) {
    return "Bu kayıp ilanı için PDF afiş servisi henüz hazır değil.";
  }

  return `Kayıp afişi oluşturulamadı (${status}).`;
}

/**
 * Kayıp ilanı için backend tarafından üretilen PDF afişini indirir.
 *
 * Beklenen backend:
 * GET /api/ads/{id}/poster
 */
export async function downloadLostPoster(adId: number): Promise<void> {
  const token = getStoredToken();

  const headers = new Headers({
    Accept: "application/pdf",
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const endpoint = resolveEndpoint(LOST_POSTER_ENDPOINT, adId);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const data = await getErrorData(response);

    throw new ApiError(
      getErrorMessage(data, response.status),
      response.status,
      data,
    );
  }

  const blob = await response.blob();

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  try {
    link.href = objectUrl;

    link.download = getDownloadFileName(
      response.headers.get("Content-Disposition"),
      adId,
    );

    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }
}