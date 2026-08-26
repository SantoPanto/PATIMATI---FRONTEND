import React, { useState } from "react";
import { useLocation } from "wouter";
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
 * {@link MapPicker} aynen kullanılıyor (tıklayarak seçme + "konumumu bul").
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
      <div className="container mx-auto p-4 max-w-lg">
        <div className="rounded border border-green-400 bg-green-100 px-4 py-3 text-green-800">
          <p className="font-semibold">İhbarınız alındı.</p>
          <p className="mt-1 text-sm">
            {sonuc.ilce
              ? `${sonuc.ilce} belediyesinin ihbar kuyruğuna düştü.`
              : "Konumdan ilçe çözülemedi; ihbarınız kayıtlara alındı ve elle ele alınacak."}
          </p>
          <p className="mt-2 text-sm">Ana sayfaya yönlendiriliyorsunuz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="mb-1 text-2xl font-bold">Hayvan İhbarı</h1>
      <p className="mb-4 text-sm text-gray-600">
        Yaralı ya da sahipsiz bir hayvan gördüyseniz buradan bildirin. Giriş
        yapmanız gerekmiyor.
      </p>

      <form onSubmit={gonder} className="space-y-4">
        <fieldset>
          <legend className="mb-2 block text-sm font-medium">Durum</legend>
          <div className="space-y-2">
            {TURLER.map((t) => (
              <label
                key={t.deger}
                className="flex cursor-pointer items-start gap-2 rounded border p-2"
              >
                <input
                  type="radio"
                  name="tur"
                  className="mt-1"
                  value={t.deger}
                  checked={tur === t.deger}
                  onChange={() => setTur(t.deger)}
                />
                <span>
                  <span className="block font-medium">{t.etiket}</span>
                  <span className="block text-xs text-gray-500">{t.aciklama}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="iletisim" className="block text-sm font-medium">
            İletişim bilgisi
          </label>
          <input
            id="iletisim"
            type="text"
            className="w-full rounded border p-2"
            placeholder="Telefon ya da e-posta"
            value={iletisim}
            onChange={(e) => setIletisim(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Belediye gerekirse size ulaşabilsin diye isteniyor.
          </p>
        </div>

        <div>
          <label htmlFor="not" className="block text-sm font-medium">
            Açıklama
          </label>
          <textarea
            id="not"
            className="w-full rounded border p-2"
            rows={3}
            placeholder="Hayvanın durumu, tam olarak nerede olduğu..."
            value={not}
            onChange={(e) => setNot(e.target.value)}
          />
        </div>

        <div>
          <span className="block text-sm font-medium">Konum</span>
          <p className="mb-2 text-xs text-gray-500">
            Haritaya tıklayarak ya da "konumumu bul" ile seçin. İhbar, seçtiğiniz
            noktanın ilçesine göre belediyeye yönlendirilir.
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
            <p className="mt-1 text-xs text-amber-700">Henüz konum seçilmedi.</p>
          )}
        </div>

        <div>
          <label htmlFor="foto" className="block text-sm font-medium">
            Fotoğraf <span className="text-gray-500">(isteğe bağlı)</span>
          </label>
          <input
            id="foto"
            type="file"
            accept="image/jpeg"
            className="w-full rounded border p-2"
            onChange={fotoSecildi}
          />
          {foto && (
            <p className="mt-1 text-xs text-gray-600">Seçilen: {foto.name}</p>
          )}
        </div>

        {hata && (
          <div
            role="alert"
            className="rounded border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {hata}
          </div>
        )}

        <button
          type="submit"
          disabled={gonderiliyor}
          className="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {gonderiliyor ? "Gönderiliyor..." : "İhbarı Gönder"}
        </button>
      </form>
    </div>
  );
}
