/**
 * /api/ai/analyze cevabını ilan ekranlarının okuduğu HAM şekle normalleştirir.
 *
 * <p><b>Neden var:</b> dolaşımda İKİ cevap şekli var ve ekranlar yalnız
 * eskisini okuyor.
 *
 * <ul>
 *   <li><b>Eski (AI servisinin ham JSON'u, backend olduğu gibi geçirir):</b>
 *       `species: "cat"` (küçük harf), `pattern`, `is_pet`; renk/göz/tasma/
 *       küpe bilgisi `labels` içinde (`"soft:color_gray"`). Buradaki `colors`
 *       alanı renk ADI değil, baskın renklerin RGB NESNELERİDİR
 *       (`{r, g, b, score}`).</li>
 *   <li><b>Yeni (backend PR #156'daki AiAnalyzeMapper):</b> `species: "CAT"`
 *       (enum adı), `coatPattern`, `isPet`; renkler `colors` içinde enum ADI
 *       olarak (`"GRAY"`). `labels` alanı hiç yok.</li>
 * </ul>
 *
 * Bu yardımcı yeni şekli eski alan adlarına çevirir; eski şekli DEĞİŞTİRMEDEN
 * geçirir. Böylece canlıdaki backend hangi sürümde olursa olsun otomatik
 * doldurma çalışır. Göz rengi/tasma/küpe etiketleri yeni cevapta hiç
 * taşınmadığı için burada geri üretilemez — o alanlar yeni şekilde boş kalır.
 */

/** İki şeklin bileşimi; tüm alanlar isteğe bağlı, ekran tipleri bununla uyumlu. */
export type AiAnalizCevabi = {
  labels?: string[];
  species?: string | null;
  is_pet?: boolean;
  isPet?: boolean;
  breed?: string | null;
  pattern?: string | null;
  coatPattern?: string | null;
  colors?: unknown[];
};

export function aiCevabiniNormallestir<T extends AiAnalizCevabi>(cevap: T): T {
  const ek: AiAnalizCevabi = {};

  if (cevap.is_pet === undefined && typeof cevap.isPet === "boolean") {
    ek.is_pet = cevap.isPet;
  }

  if (cevap.pattern == null && typeof cevap.coatPattern === "string") {
    ek.pattern = cevap.coatPattern;
  }

  // Yalnız DİZGİ öğeler renk adıdır; eski şeklin RGB nesneleri elenir.
  const renkAdlari = Array.isArray(cevap.colors)
    ? cevap.colors.filter((c): c is string => typeof c === "string")
    : [];
  if ((!cevap.labels || cevap.labels.length === 0) && renkAdlari.length > 0) {
    ek.labels = renkAdlari.map((ad) => `soft:color_${ad.toLowerCase()}`);
  }

  return { ...cevap, ...ek };
}
