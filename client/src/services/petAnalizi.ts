import { request } from "./api";
import type { PetReportResult } from "./types";

/**
 * `hata_nedeni`'nin (pet_raporu_prompt.py::ALAN KURALLARI) her değeri için
 * kullanıcıya gösterilecek Türkçe mesaj. Kod ASLA ekrana sızdırılmaz.
 * `SERVIS_KULLANILAMIYOR` LLM'den değil, AI servisinin kendi dahili
 * yedeğinden gelir (bkz. pet_raporu.py) -- burada da ele alınır.
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
 * "Ben Neyim?" — tek bir kedi/köpek fotoğrafından zengin bir analiz raporu.
 *
 * POST /api/public/pet-analiz — girişsiz erişilebilir (bkz. services/
 * sightings.ts::createSighting ile aynı desen); oturum varsa jeton
 * `request()` tarafından kendiliğinden eklenir ve backend'de daha yüksek
 * bir günlük limit uygulanır (misafir/kullanıcı ayrımı backend'de).
 *
 * Gövde multipart: "file" (zorunlu) + "kullanici_notu" (opsiyonel).
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
  });
}
