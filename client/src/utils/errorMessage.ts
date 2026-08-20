import { ApiError } from "../services/api";

const NETWORK_ERROR_MESSAGE =
  "Sunucuya bağlanılamadı. Lütfen bağlantınızı kontrol edip tekrar deneyin.";

const NOT_FOUND_MESSAGE = "Aradığınız içerik bulunamadı.";

const UNAUTHORIZED_MESSAGE = "Bu işlem için giriş yapmalısınız.";

const FORBIDDEN_MESSAGE = "Bu işlemi yapmaya yetkiniz yok.";

export const GENERIC_ERROR_MESSAGE = "Bir hata oluştu. Lütfen tekrar deneyin.";

/**
 * Backend'den veya tarayıcıdan gelip kullanıcıya ham şekilde
 * gösterilmemesi gereken teknik/İngilizce ifade kalıpları.
 */
const TECHNICAL_MESSAGE_PATTERNS: RegExp[] = [
  /failed to fetch/i,
  /networkerror/i,
  /network request failed/i,
  /load failed/i,
  /^not found$/i,
  /no message available/i,
  /internal server error/i,
  /bad gateway/i,
  /service unavailable/i,
  /gateway timeout/i,
  /unexpected token/i,
  /exception/i,
  /validation failed/i,
  /constraint violation/i,
  /rejected value/i,
  /stack ?trace/i,
  /^\[object /i,
  /^\s*[{[]/, // ham JSON gövdesi
];

function looksTechnical(message: string): boolean {
  const trimmed = message.trim();

  if (!trimmed) {
    return true;
  }

  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) =>
    pattern.test(trimmed),
  );
}

export function extractRfc7807Details(error: unknown): string | null {
  if (error instanceof ApiError && error.data && typeof error.data === "object") {
    const data = error.data as Record<string, unknown>;

    const invalidParams =
      (data.properties && typeof data.properties === "object"
        ? (data.properties as Record<string, unknown>).invalid_params
        : undefined) || data.invalid_params;

    if (Array.isArray(invalidParams) && invalidParams.length > 0) {
      const messages = invalidParams
        .map((param) => {
          if (param && typeof param === "object") {
            const p = param as Record<string, unknown>;
            const field = (p.name || p.field) as string | undefined;
            const msg = (p.reason || p.message) as string | undefined;
            if (field && msg) {
              return `${field}: ${msg}`;
            }
            return msg || field || "";
          }
          return "";
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join("\n");
      }
    }

    if (typeof data.detail === "string" && data.detail.trim().length > 0) {
      return data.detail;
    }
  }
  return null;
}

export function extractInvalidParams(
  error: unknown,
): Array<{ name?: string; field?: string; reason?: string; message?: string; detail?: string }> | null {
  if (error instanceof ApiError && error.data && typeof error.data === "object") {
    const data = error.data as Record<string, unknown>;

    const invalidParams =
      (data.properties && typeof data.properties === "object"
        ? (data.properties as Record<string, unknown>).invalid_params
        : undefined) || data.invalid_params;

    if (Array.isArray(invalidParams)) {
      return invalidParams as Array<{
        name?: string;
        field?: string;
        reason?: string;
        message?: string;
        detail?: string;
      }>;
    }
  }
  return null;
}

/**
 * Herhangi bir catch(error) bloğunda kullanıcıya gösterilecek Türkçe,
 * anlaşılır bir mesaj üretir. Ham/teknik ayrıntı yalnızca console'a
 * yazılır; kullanıcı arayüzüne asla stack trace, JSON veya İngilizce
 * teknik metin sızdırılmaz.
 *
 * Backend'in kendi ürettiği anlamlı Türkçe mesajlar (ör. "Bu e-posta
 * adresi zaten kayıtlı.") ve RFC 7807 detail/invalid_params olduğu gibi
 * kullanıcıya gösterilir.
 */
export function getUserErrorMessage(
  error: unknown,
  fallback: string = GENERIC_ERROR_MESSAGE,
): string {
  const rfcDetails = extractRfc7807Details(error);
  if (rfcDetails) {
    return rfcDetails;
  }

  if (error instanceof TypeError) {
    return NETWORK_ERROR_MESSAGE;
  }

  if (error instanceof ApiError) {
    if (error.status === 404) {
      return NOT_FOUND_MESSAGE;
    }

    if (error.status === 401) {
      return UNAUTHORIZED_MESSAGE;
    }

    if (error.status === 403) {
      return FORBIDDEN_MESSAGE;
    }
  }

  if (error instanceof Error && !looksTechnical(error.message)) {
    return error.message;
  }

  return fallback;
}
