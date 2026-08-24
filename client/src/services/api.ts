import {
  clearAuthStorage,
  getStoredToken,
} from "./authStorage";
import type { ComplaintResponse, MatchResponseDTO, UserComplaintRequestDTO } from "./types";

const rawApiUrl =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080");

const API_BASE_URL = String(rawApiUrl).replace(/\/+$/, "");

type RequestOptions = RequestInit & {
  requiresAuth?: boolean;
  /**
   * İstek bu süre içinde sonuçlanmazsa iptal edilir (ms). Verilmezse
   * aşağıdaki varsayılanlar uygulanır.
   */
  timeoutMs?: number;
};

/*
 * ZAMAN AŞIMI — neden var:
 * `fetch`in kendiliğinden bir zaman aşımı YOKTUR. Mobil ağda yarıda kalan bir
 * yükleme ne çözülür ne reddedilir; çağıran `finally` bloğuna hiç ulaşmaz ve
 * ekran "İlan oluşturuluyor..." yazısında SONSUZA KADAR asılı kalır — hata
 * bile görünmez. Sahadan bildirilen donma tam olarak buydu.
 *
 * İki ayrı süre: fotoğraf yükleyen istekler (FormData) yavaş bağlantıda
 * dakikalarca sürebilir, metin istekleri süremez.
 */
const VARSAYILAN_ZAMAN_ASIMI_MS = 30_000;
const YUKLEME_ZAMAN_ASIMI_MS = 180_000;

/** Zaman aşımında fırlatılan ApiError'ın durum kodu (RFC 9110 §15.5.9). */
export const ZAMAN_ASIMI_DURUMU = 408;

export const YUK_COK_BUYUK_MESAJI =
  "Fotoğraflar sunucunun kabul ettiğinden büyük. Daha az veya daha küçük fotoğrafla tekrar deneyin.";

export const ZAMAN_ASIMI_MESAJI =
  "İstek zaman aşımına uğradı. Bağlantınız yavaş olabilir; tekrar deneyin.";

export const AUTH_UNAUTHORIZED_EVENT =
  "patimati:auth-unauthorized";

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(
    message: string,
    status: number,
    data: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getErrorMessage(
  data: unknown,
  status: number,
): string {
  /*
   * 413 gövdesi GÜVENİLMEZ: sınırı aşan istek uygulamaya hiç ulaşmadan
   * ters vekil (nginx) tarafından kesilebilir; o zaman gövde JSON değil HTML
   * olur ve aşağıdaki alan taraması boşa düşerek kullanıcıya
   * "İşlem sırasında bir hata oluştu (413)" gösterilir — sahada görülen
   * mesaj buydu. Uygulama kendisi cevap verse bile metin İngilizcedir
   * ("Maximum upload size exceeded"). İki durumda da kullanıcıya ne
   * yapacağını söyleyen kendi metnimizi veriyoruz.
   */
  if (status === 413) {
    return YUK_COK_BUYUK_MESAJI;
  }

  if (data && typeof data === "object") {
    const errorData =
      data as Record<string, unknown>;

    const candidates = [
      errorData.message,
      errorData.detail,
      errorData.error,
      errorData.title,
    ];

    const message = candidates.find(
      (candidate): candidate is string =>
        typeof candidate === "string" &&
        candidate.trim().length > 0,
    );

    if (message) {
      return message;
    }
  }

  return `İşlem sırasında bir hata oluştu (${status})`;
}

export function notifyUnauthorized(): void {
  clearAuthStorage();

  window.dispatchEvent(
    new Event(AUTH_UNAUTHORIZED_EVENT),
  );
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    requiresAuth = false,
    headers: customHeaders,
    timeoutMs,
    ...restOptions
  } = options;

  const headers = new Headers(customHeaders);

  if (
    restOptions.body &&
    !(restOptions.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  const token = getStoredToken();

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  } else if (requiresAuth) {
    throw new ApiError(
      "Bu işlem için giriş yapmalısınız.",
      401,
      null,
    );
  }

  /*
   * Süreyi gövde türüne göre seçiyoruz: fotoğraflı (FormData) istekler yavaş
   * mobil bağlantıda dakikalar sürebilir, metin istekleri süremez.
   */
  const sure =
    timeoutMs ??
    (restOptions.body instanceof FormData
      ? YUKLEME_ZAMAN_ASIMI_MS
      : VARSAYILAN_ZAMAN_ASIMI_MS);

  const zamanAsimiKontrolu = new AbortController();
  let zamanAsimiOldu = false;

  const zamanlayici = window.setTimeout(() => {
    zamanAsimiOldu = true;
    zamanAsimiKontrolu.abort();
  }, sure);

  /*
   * Çağıranın kendi signal'i varsa onu EZMİYORUZ: ikisinden biri iptal
   * ederse istek iptal olur (ör. geokod.ts kendi denetleyicisini geçiriyor).
   */
  const cagiranSignali = restOptions.signal;
  const cagiranIptaliniAktar = () => zamanAsimiKontrolu.abort();

  if (cagiranSignali) {
    if (cagiranSignali.aborted) {
      zamanAsimiKontrolu.abort();
    } else {
      cagiranSignali.addEventListener("abort", cagiranIptaliniAktar);
    }
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...restOptions,
        headers,
        signal: zamanAsimiKontrolu.signal,
      },
    );
  } catch (err) {
    /*
     * Zaman aşımı ile kullanıcının/çağıranın iptali AYNI hatayı (AbortError)
     * üretir; ayırt eden tek şey bayrağımız. Zaman aşımını ApiError'a
     * çeviriyoruz ki ekranlar diğer hatalarla aynı yoldan mesaj üretsin.
     */
    if (zamanAsimiOldu) {
      throw new ApiError(ZAMAN_ASIMI_MESAJI, ZAMAN_ASIMI_DURUMU, null);
    }
    if (err instanceof DOMException && err.name === "AbortError") {
      // Kasıtlı iptal (çağıranın kendi AbortController.abort()'u) -- gerçek
      // bir ağ hatası değil, ApiError'a çevrilmeden olduğu gibi fırlatılmalı
      // ki çağıran taraf (ör. bir useEffect cleanup'ı) bunu kullanıcıya hata
      // olarak göstermesin.
      throw err;
    }
    // fetch() burada çıplak bir TypeError fırlatır (bağlantı koptu, DNS
    // çözülemedi, CORS engellendi vb.). Çağıranların çoğu ApiError
    // bekliyor; aynı biçime çeviriyoruz.
    throw new ApiError(
      "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.",
      0,
      null,
    );
  } finally {
    window.clearTimeout(zamanlayici);
    cagiranSignali?.removeEventListener("abort", cagiranIptaliniAktar);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      notifyUnauthorized();
    }

    throw new ApiError(
      getErrorMessage(data, response.status),
      response.status,
      data,
    );
  }

  return data as T;
}

/**
 * POST /api/complaints/user (Bearer)
 * Report a user for inappropriate behavior
 */
export function reportUser(
  payload: UserComplaintRequestDTO,
): Promise<ComplaintResponse> {
  return request<ComplaintResponse>("/api/complaints/user", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

/**
 * GET /api/matches/my-matches (Bearer)
 * Fetch matches for the authenticated user's ads
 */
export function getMyMatches(): Promise<MatchResponseDTO[]> {
  return request<MatchResponseDTO[]>("/api/matches/my-matches", {
    method: "GET",
    requiresAuth: true,
  });
}

export { API_BASE_URL };