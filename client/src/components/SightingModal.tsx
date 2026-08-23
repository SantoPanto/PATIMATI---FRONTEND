import React, { useEffect, useState } from "react";
import { CheckCircle2, Eye, Loader2, MapPin, X } from "lucide-react";
import { createSighting } from "../services/sightings";
import { ilIlcedenKoordinat } from "../utils/geokod";
import { getUserErrorMessage } from "../utils/errorMessage";
import { compressImage } from "../utils/imageCompression";

/**
 * "Bu hayvanı gördüm" formu — üçüncü kişi, ilan açmadan kayıp ilanına
 * konum + opsiyonel foto + not bırakır (girişsiz de çalışır; afiş QR'ı
 * senaryosu). Konum üç yolla dolar: GPS · il/ilçe geokodlaması (#105
 * util'i) · elle koordinat (#102 deseni). İletişim zorunlu: sahibinin
 * bildirene ulaşabileceği tek yol bu.
 */
interface SightingModalProps {
  isOpen: boolean;
  onClose: () => void;
  adId: number;
  adTitle?: string;
  /** Girişli kullanıcıda iletişim alanına önceden doldurulur. */
  defaultContact?: string;
  onSuccess?: () => void;
}

export default function SightingModal({
  isOpen,
  onClose,
  adId,
  adTitle,
  defaultContact,
  onSuccess,
}: SightingModalProps) {
  const [enlem, setEnlem] = useState("");
  const [boylam, setBoylam] = useState("");
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [not, setNot] = useState("");
  const [iletisim, setIletisim] = useState(defaultContact ?? "");
  const [foto, setFoto] = useState<File | null>(null);
  const [bilgi, setBilgi] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [basarili, setBasarili] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  /* Modal her açıldığında form sıfırlanır (ComplaintModal'ın
     render-sırasında-sıfırlama deseni). */
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setEnlem("");
      setBoylam("");
      setIl("");
      setIlce("");
      setNot("");
      setIletisim(defaultContact ?? "");
      setFoto(null);
      setBilgi("");
      setHata(null);
      setBasarili(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !gonderiliyor) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, gonderiliyor]);

  if (!isOpen) return null;

  const konumuKullan = () => {
    setHata(null);
    setBilgi("");
    if (!navigator.geolocation) {
      setHata("Tarayıcınız konum özelliğini desteklemiyor.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setEnlem(coords.latitude.toFixed(6));
        setBoylam(coords.longitude.toFixed(6));
        setBilgi("Konum alındı.");
      },
      () => {
        setHata("Konum alınamadı. Konum izni verdiğinizden emin olun.");
      },
    );
  };

  const ilIlcedenBul = async () => {
    setHata(null);
    setBilgi("");
    const sonuc = await ilIlcedenKoordinat(il, ilce);
    if (!sonuc) {
      setHata("İl/ilçeden konum bulunamadı. Yazımı kontrol edin.");
      return;
    }
    setEnlem(sonuc.latitude.toFixed(6));
    setBoylam(sonuc.longitude.toFixed(6));
    setBilgi("Konum il/ilçeden dolduruldu.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const lat = Number(enlem.trim().replace(",", "."));
    const lng = Number(boylam.trim().replace(",", "."));
    if (
      enlem.trim() === "" ||
      boylam.trim() === "" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      setHata("Önce konum seçin: GPS, il/ilçe ya da elle koordinat.");
      return;
    }
    if (iletisim.trim().length < 5) {
      setHata("İletişim bilgisi zorunlu (telefon ya da e-posta) — sahibi size ulaşabilmeli.");
      return;
    }

    try {
      setGonderiliyor(true);
      setHata(null);

      let finalFoto = foto;
      if (foto) {
        finalFoto = await compressImage(foto);
      }

      await createSighting(
        adId,
        {
          latitude: lat,
          longitude: lng,
          note: not.trim() || undefined,
          reporterContact: iletisim.trim(),
        },
        finalFoto,
      );

      setBasarili(true);
      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setHata(
        getUserErrorMessage(
          err,
          "Bildirim gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
        ),
      );
    } finally {
      setGonderiliyor(false);
    }
  };

  const girdiSinifi =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm " +
    "text-slate-900 focus:border-orange-400 focus:outline-none " +
    "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm animate-in fade-in duration-200"
      role="presentation"
      onMouseDown={() => !gonderiliyor && onClose()}
    >
      <section
        aria-labelledby="sighting-modal-title"
        aria-modal="true"
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-[28px] border border-slate-100 bg-white shadow-2xl shadow-slate-950/25 dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Eye size={22} aria-hidden="true" />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Görülme bildirimi
              </span>
              <h2
                id="sighting-modal-title"
                className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-50"
              >
                {adTitle ? `"${adTitle}"` : "Bu hayvanı gördüm"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={gonderiliyor}
            aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {basarili ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <CheckCircle2 size={44} className="text-emerald-500" />
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-50">
              Bildirimin ilan sahibine iletildi
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Teşekkürler — verdiğin konum ve iletişim bilgisi sahibine
              ulaşacak. 🧡
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5">
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              Hayvanı nerede gördüğünü işaretle; istersen fotoğraf ve kısa
              bir not ekle. Üye olmana gerek yok.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={konumuKullan}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <MapPin size={16} />
                Konumumu kullan
              </button>
              <span className="text-sm text-slate-400 dark:text-slate-500">ya da il/ilçe yaz:</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <label
                  htmlFor="gorulme-il"
                  className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  İl
                </label>
                <input
                  id="gorulme-il"
                  type="text"
                  value={il}
                  onChange={(olay) => setIl(olay.target.value)}
                  placeholder="Örn. Bursa"
                  className={girdiSinifi}
                />
              </div>
              <div>
                <label
                  htmlFor="gorulme-ilce"
                  className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  İlçe
                </label>
                <input
                  id="gorulme-ilce"
                  type="text"
                  value={ilce}
                  onChange={(olay) => setIlce(olay.target.value)}
                  placeholder="Örn. Nilüfer"
                  className={girdiSinifi}
                />
              </div>
              <div className="col-span-2 flex items-end sm:col-span-1">
                <button
                  type="button"
                  onClick={() => {
                    void ilIlcedenBul();
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500/60"
                >
                  Bul
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="gorulme-enlem"
                  className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  Enlem
                </label>
                <input
                  id="gorulme-enlem"
                  type="text"
                  inputMode="decimal"
                  value={enlem}
                  onChange={(olay) => setEnlem(olay.target.value)}
                  placeholder="40.1928"
                  className={girdiSinifi}
                />
              </div>
              <div>
                <label
                  htmlFor="gorulme-boylam"
                  className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  Boylam
                </label>
                <input
                  id="gorulme-boylam"
                  type="text"
                  inputMode="decimal"
                  value={boylam}
                  onChange={(olay) => setBoylam(olay.target.value)}
                  placeholder="29.0610"
                  className={girdiSinifi}
                />
              </div>
            </div>

            <div className="mt-3">
              <label
                htmlFor="gorulme-not"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Not (isteğe bağlı)
              </label>
              <textarea
                id="gorulme-not"
                value={not}
                onChange={(olay) => setNot(olay.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Ne zaman ve nasıl gördün? Hayvanın durumu nasıldı?"
                className={girdiSinifi}
              />
            </div>

            <div className="mt-3">
              <label
                htmlFor="gorulme-iletisim"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                İletişim (zorunlu — sahibi size ulaşabilsin)
              </label>
              <input
                id="gorulme-iletisim"
                type="text"
                value={iletisim}
                onChange={(olay) => setIletisim(olay.target.value)}
                placeholder="Telefon ya da e-posta"
                className={girdiSinifi}
              />
            </div>

            <div className="mt-3">
              <label
                htmlFor="gorulme-foto"
                className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                Fotoğraf (isteğe bağlı, JPEG, en fazla 5 MB)
              </label>
              <input
                id="gorulme-foto"
                type="file"
                accept="image/jpeg,image/jpg"
                onChange={(olay) => setFoto(olay.target.files?.[0] ?? null)}
                className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-slate-300 dark:hover:file:bg-slate-700"
              />
            </div>

            {hata && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {hata}
              </p>
            )}
            {!hata && bilgi && (
              <p className="mt-3 text-sm text-emerald-600">{bilgi}</p>
            )}

            <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={gonderiliyor}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={gonderiliyor}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {gonderiliyor && (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                )}
                {gonderiliyor ? "Gönderiliyor…" : "Bildirimi Gönder"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
