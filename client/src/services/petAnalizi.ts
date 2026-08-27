import { request } from "./api";
import type { PetReportResult } from "./types";

/**
 * `hata_nedeni`'nin her değeri için kullanıcıya gösterilecek Türkçe mesaj.
 */
const HATA_NEDENI_MESAJLARI: Record<string, string> = {
  HAYVAN_YOK:
    "Fotoğrafta bir hayvan tespit edemedik. Kedi veya köpeğinizin net göründüğü başka bir fotoğraf deneyin.",
  KEDI_KOPEK_DEGIL:
    "Bu özellik şu an yalnızca kedi ve köpekler için çalışıyor.",
  INSAN_FOTOGRAFI:
    "Fotoğrafta bir hayvan bulamadık. Lütfen yalnızca hayvanın göründüğü bir fotoğraf yükleyin.",
  GORUNTU_COK_BULANIK:
    "Fotoğraf analiz için çok bulanık. Daha net bir fotoğrafla tekrar deneyin.",
  HAYVAN_COK_UZAK:
    "Hayvan fotoğrafta çok küçük/uzak görünüyor. Daha yakından çekilmiş bir fotoğraf deneyin.",
  SINIFLANDIRICI_CELISKISI:
    "Fotoğrafı tam olarak analiz edemedik. Başka bir fotoğrafla tekrar deneyin.",
  SERVIS_KULLANILAMIYOR:
    "Analiz servisi şu anda kullanılamıyor. Lütfen birazdan tekrar deneyin.",
};

const VARSAYILAN_HATA_MESAJI =
  "Fotoğraf analiz edilemedi. Başka bir fotoğrafla tekrar deneyin.";

export function hataNedeniMesaji(hataNedeni?: string | null): string {
  if (!hataNedeni) return VARSAYILAN_HATA_MESAJI;
  return HATA_NEDENI_MESAJLARI[hataNedeni] ?? VARSAYILAN_HATA_MESAJI;
}

/**
 * "Ben Neyim?" — tek bir kedi/köpek fotoğrafından zengin pet raporu al.
 *
 * POST /api/public/pet-analiz — 2026-08-27'den beri AI'nın LLM tabanlı
 * /analyze_pet ucuna gider (AI #33+#37, BE #185); cevap PetReportResult
 * sözleşmesidir (karakter profili, bakım ipuçları, kimlik alanları...).
 * kullanici_notu LLM prompt'una bağlam olarak eklenir.
 */
export function petRaporuAl(
  file: File,
  kullaniciNotu?: string,
): Promise<PetReportResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (kullaniciNotu && kullaniciNotu.trim()) {
    formData.append("kullanici_notu", kullaniciNotu.trim());
  }

  return request<PetReportResult>("/api/public/pet-analiz", {
    method: "POST",
    body: formData,
    requiresAuth: true,
  });
}
