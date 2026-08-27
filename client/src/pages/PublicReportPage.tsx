import React, { useState } from "react";
import { useLocation } from "wouter";
import { Megaphone } from "lucide-react";
import MapPicker from "../components/MapPicker";
import { ApiError, YUK_COK_BUYUK_MESAJI } from "../services/api";
import { createReport, type ReportType } from "../services/reportService";

/**
 * Halka açık ihbar formu (belediye modülü, C1).
 *
 * <p>Girişsiz doldurulabilir. Sunucu ilçeyi KOORDİNATTAN türetiyor ve ihbarı
 * o ilçenin belediyesine yönlendiriyor — bu yüzden konum düz metin değil,
 * harita üzerinden seçilen koordinat. Konum seçilmeden gönderilemez.
 *
 * <p>Harita için yeni bileşen yazılmadı; ilan formlarının kullandığı
 * {@link MapPicker} aynen kullanılıyor.
 *
 * <p>Görsel dil: uygulamanın {@code pm-*} tasarım sistemi — 27.08 ikinci
 * geri bildirimi ("açan kendini başka yerde bulmasın").
 */

const TURLER: { deger: ReportType; etiket: string; aciklama: string }[] = [
  { deger: "YARALI", etiket: "Yaralı hayvan", aciklama: "Acil müdahale gerekiyor" },
  { deger: "SAHIPSIZ", etiket: "Sahipsiz hayvan", aciklama: "Bakıma / barınağa ihtiyacı var" },
  { deger: "DIGER", etiket: "Diğer", aciklama: "Yukarıdakilere girmiyor" },
];

/** Arka yüz JPEG + 5MB sınırı uyguluyor; kullanıcı 413 beklemeden görsün. */
const EN_BUYUK_FOTO_BAYT = 5 * 1024 * 1024;

export default function PublicReportPage() {
  const [, setLocation] = useLocation();

  const [tur, setTur] = useState<ReportType>("YARALI");
  const [iletisim, setIletisim] = useState("");
  const [not, setNot] = useState("");
  const [enlem, setEnlem] = useState<number | null>(null);
  const [boylam, setBoylam] = useState<number | null>(null);
  const [foto, setFoto] = useState<File | null>(null);

  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sonuc, setSonuc] = useState<{ ilce: string | null } | null>(null);

  const konumSecildi = enlem !== null && boylam !== null;

  const fotoSecildi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const secilen = e.target.files?.[0] ?? null;
    setHata(null);

    if (secilen && secilen.size > EN_BUYUK_FOTO_BAYT) {
      setHata(YUK_COK_BUYUK_MESAJI);
      e.target.value = "";
      setFoto(null);
      return;
    }
    setFoto(secilen);
  };

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(null);

    if (!konumSecildi) {
      setHata("Haritadan konum seçin — ihbar konuma göre belediyeye yönlendiriliyor.");
      return;
    }

    setGonderiliyor(true);
    try {
      const kayit = await createReport(
        {
          reporterContact: iletisim.trim(),
          type: tur,
          note: not.trim() || undefined,
          latitude: enlem,
          longitude: boylam,
        },
        foto,
      );
      setSonuc({ ilce: kayit.district });
      setTimeout(() => setLocation("/"), 4000);
    } catch (e) {
      // Sunucunun kendi mesajı varsa onu göster: doğrulama hatalarında
      // (400) hangi alanın eksik olduğunu kullanıcıya o söylüyor.
      const mesaj =
        e instanceof ApiError && e.message
          ? e.message
          : "İhbar gönderilemedi. Bağlantınızı kontrol edip tekrar deneyin.";
      setHata(mesaj);
    } finally {
      setGonderiliyor(false);
    }
  };

  if (sonuc) {
    return (
      <main className="pm-main">
        <div className="pm-container max-w-xl">
          <div
            role="status"
            className="pm-card border-green-300 bg-green-50 p-5 text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400"
          >
            <p className="font-bold">İhbarınız alındı.</p>
            <p className="mt-1 text-sm">
              {sonuc.ilce
                ? `${sonuc.ilce} belediyesinin ihbar kuyruğuna düştü.`
                : "Konumdan ilçe çözülemedi; ihbarınız kayıtlara alındı ve elle ele alınacak."}
            </p>
            <p className="mt-2 text-sm">Ana sayfaya yönlendiriliyorsunuz...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pm-main">
      <div className="pm-container max-w-xl">
        <header className="pm-page-heading">
          <span className="pm-eyebrow">
            <Megaphone size={14} className="mr-1 inline-block align-[-2px]" />
            İhbar
          </span>
          <h1>Hayvan İhbarı</h1>
          <p>
            Yaralı ya da sahipsiz bir hayvan gördüyseniz buradan bildirin.
            Giriş yapmanız gerekmiyor.
          </p>
        </header>

        <form onSubmit={gonder} className="pm-card space-y-5 p-5">
          <fieldset>
            <legend className="pm-field__label mb-2">Durum</legend>
            <div className="space-y-2">
              {TURLER.map((t) => (
                <label
                  key={t.deger}
                  className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 transition ${
                    tur === t.deger
                      ? "border-[var(--pm-primary)] bg-[var(--pm-primary-soft)]"
                      : "border-[var(--pm-border)] hover:border-[var(--pm-primary)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="tur"
                    className="mt-1 accent-[var(--pm-primary)]"
                    value={t.deger}
                    checked={tur === t.deger}
                    onChange={() => setTur(t.deger)}
                  />
                  <span>
                    <span className="block font-bold">{t.etiket}</span>
                    <span className="block text-xs text-[var(--pm-muted)]">
                      {t.aciklama}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="pm-field">
            <label htmlFor="iletisim" className="pm-field__label">
              İletişim bilgisi
            </label>
            <input
              id="iletisim"
              type="text"
              className="pm-input"
              placeholder="Telefon ya da e-posta"
              value={iletisim}
              onChange={(e) => setIletisim(e.target.value)}
              required
            />
            <p className="text-xs text-[var(--pm-muted)]">
              Belediye gerekirse size ulaşabilsin diye isteniyor.
            </p>
          </div>

          <div className="pm-field">
            <label htmlFor="not" className="pm-field__label">
              Açıklama
            </label>
            <textarea
              id="not"
              className="pm-input h-auto min-h-24 py-3"
              rows={3}
              placeholder="Hayvanın durumu, tam olarak nerede olduğu..."
              value={not}
              onChange={(e) => setNot(e.target.value)}
            />
          </div>

          <div className="pm-field">
            <span className="pm-field__label">Konum</span>
            <p className="text-xs text-[var(--pm-muted)]">
              Haritaya tıklayarak ya da "konumumu bul" ile seçin. İhbar,
              seçtiğiniz noktanın ilçesine göre belediyeye yönlendirilir.
            </p>
            <MapPicker
              latitude={enlem}
              longitude={boylam}
              onChange={(lat, lng) => {
                setEnlem(lat);
                setBoylam(lng);
                setHata(null);
              }}
            />
            {!konumSecildi && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Henüz konum seçilmedi.
              </p>
            )}
          </div>

          <div className="pm-field">
            <label htmlFor="foto" className="pm-field__label">
              Fotoğraf{" "}
              <span className="font-normal text-[var(--pm-muted)]">
                (isteğe bağlı)
              </span>
            </label>
            <input
              id="foto"
              type="file"
              accept="image/jpeg"
              className="pm-input h-auto py-2.5"
              onChange={fotoSecildi}
            />
            {foto && (
              <p className="text-xs text-[var(--pm-muted)]">
                Seçilen: {foto.name}
              </p>
            )}
          </div>

          {hata && (
            <div
              role="alert"
              className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            >
              {hata}
            </div>
          )}

          <button
            type="submit"
            disabled={gonderiliyor}
            className="pm-button pm-button--primary w-full"
          >
            {gonderiliyor ? "Gönderiliyor..." : "İhbarı Gönder"}
          </button>
        </form>
      </div>
    </main>
  );
}
