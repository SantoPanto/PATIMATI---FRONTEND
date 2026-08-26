import { request } from "./api";
import type { AdType } from "./types";

/**
 * Belediye paneli (belediye modülü, A parçası) — sayaçlar ve ısı haritası.
 *
 * <p><b>İlçe parametre DEĞİL:</b> iki uç da kapsamı sunucuda oturumdaki
 * kurum hesabından türetiyor. İstemci ilçe göndermez; gönderse de dikkate
 * alınmaz. Kapsam çözülemezse (hesaba ilçe atanmamışsa) istek 403 döner —
 * sessizce "hepsini göster"e düşmez.
 *
 * <p>İkisi de giriş ister (INSTITUTION ya da ADMIN).
 */

/** {@code MunicipalityStatsDto} ile birebir. */
export type PanelIstatistikleri = {
  /** Kurumun kapsamındaki ilçe — sunucudan gelir, istemci sabiti kullanılmaz. */
  district: string;
  lostCount: number;
  foundCount: number;
  adoptionCount: number;
  /**
   * Sahibine kavuşan hayvan sayısı.
   *
   * <p>⚠ Panel ekranı bir ara bunu {@code resolvedCount} adıyla tutuyordu;
   * arka yüzdeki ad {@code reunionCount}. Adı kayarsa alan {@code undefined}
   * gelir ve sayaç sessizce boş görünür — bu yüzden bekçi testte kilitli.
   */
  reunionCount: number;
};

/** {@code HeatmapPointDto} ile birebir. */
export type IsiHaritasiNoktasi = {
  latitude: number;
  longitude: number;
  /** Noktanın geldiği ilan türü. Kaynak {@code ads.ad_type}. */
  type: AdType;
  createdAt: string;
};

/** Arka yüzdeki {@code @Max(2000)} sınırı. */
export const EN_COK_ISI_NOKTASI = 2000;

/**
 * Tarih aralığı — {@link Date} ya da doğrudan sunucunun beklediği biçimde
 * yazılmış dizgi kabul edilir.
 */
export type TarihAraligi = {
  startDate: Date | string;
  endDate: Date | string;
};

/**
 * Sunucu {@code LocalDateTime} bekliyor: saat dilimi eki OLMADAN
 * {@code 2026-08-01T00:00:00}.
 *
 * <p><b>Neden {@code toISOString()} kullanılmıyor:</b> o {@code Z} ekli ve
 * milisaniyeli UTC üretir ({@code 2026-08-01T00:00:00.000Z}). Sunucudaki alan
 * yerel bir tarih-saat; {@code Z}'li değer ya reddedilir ya da UTC duvar saati
 * yerel sanılarak SESSİZCE kayar — kullanıcı yanlış aralığın sayılarını doğru
 * sanır. Bu yüzden biçimlendirme burada, tek yerde yapılıyor.
 */
export function yerelIsoTarihSaat(tarih: Date): string {
  const ikiHane = (n: number) => String(n).padStart(2, "0");
  return (
    `${tarih.getFullYear()}-${ikiHane(tarih.getMonth() + 1)}-${ikiHane(tarih.getDate())}` +
    `T${ikiHane(tarih.getHours())}:${ikiHane(tarih.getMinutes())}:${ikiHane(tarih.getSeconds())}`
  );
}

function tarihParametresi(deger: Date | string): string {
  return deger instanceof Date ? yerelIsoTarihSaat(deger) : deger;
}

function aralikSorgusu(aralik: TarihAraligi): URLSearchParams {
  const sorgu = new URLSearchParams();
  sorgu.set("startDate", tarihParametresi(aralik.startDate));
  sorgu.set("endDate", tarihParametresi(aralik.endDate));
  return sorgu;
}

/**
 * GET /api/municipality/panel/stats (Bearer).
 *
 * <p>{@code startDate} ve {@code endDate} ZORUNLU — sunucuda varsayılanı yok,
 * eksik gönderilirse 400 döner. Ekran bir tarih aralığı seçtirmeli.
 */
export function getPanelIstatistikleri(
  aralik: TarihAraligi,
): Promise<PanelIstatistikleri> {
  return request<PanelIstatistikleri>(
    `/api/municipality/panel/stats?${aralikSorgusu(aralik).toString()}`,
    { method: "GET", requiresAuth: true },
  );
}

/**
 * GET /api/municipality/panel/heatmap (Bearer).
 *
 * <p>{@code limit} verilmezse sunucu 500 kullanır; üst sınır
 * {@link EN_COK_ISI_NOKTASI}. Sınır aşılırsa istek hiç gönderilmez: sunucudan
 * dönecek 400 "hangi alan" demez, buradaki hata söyler.
 */
export function getIsiHaritasi(
  aralik: TarihAraligi,
  limit?: number,
): Promise<IsiHaritasiNoktasi[]> {
  const sorgu = aralikSorgusu(aralik);

  if (limit !== undefined) {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("Isı haritası sınırı 1 ya da daha büyük bir tam sayı olmalı.");
    }
    if (limit > EN_COK_ISI_NOKTASI) {
      throw new Error(
        `Isı haritası sınırı en çok ${EN_COK_ISI_NOKTASI} olabilir (istenen: ${limit}).`,
      );
    }
    sorgu.set("limit", String(limit));
  }

  return request<IsiHaritasiNoktasi[]>(
    `/api/municipality/panel/heatmap?${sorgu.toString()}`,
    { method: "GET", requiresAuth: true },
  );
}
