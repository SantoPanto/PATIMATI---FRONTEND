import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, PartyPopper, X } from "lucide-react";

import { getAdById, resolveLostAdFound } from "../services/ads";
import { getMyMatches } from "../services/api";
import type {
  AdResponse,
  MatchResponseDTO,
  ResolveLostAdRequest,
} from "../services/types";
import { getImageUrl } from "../utils/imageUrl";
import { getUserErrorMessage } from "../utils/errorMessage";

interface ResolveFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: AdResponse | null;
  onSuccess: (ad: AdResponse) => void;
}

/** Eşleşme kaydında `myAdId` de `myAd.id` de boş olabiliyor; ikisi de sözleşmede
 * isteğe bağlı. Tek birine bakan süzgeç, diğerinin dolu olduğu satırları sessizce
 * atar ve kullanıcı aday listesini BOŞ görür. */
function ilanKimligi(ozet: { id?: number } | undefined, kimlik?: number) {
  return kimlik ?? ozet?.id;
}

function yuzde(deger: number | undefined | null): number {
  if (deger === undefined || deger === null || Number.isNaN(deger)) return 0;
  const oran = deger <= 1 ? deger * 100 : deger;
  return Math.min(100, Math.max(0, Math.round(oran)));
}

/**
 * "Hayvanımı buldum" akışı — kayıp ilanını BULUNDU olarak kapatır.
 *
 * <p><b>Neden ayrı bir pencere:</b> uç (`PUT /api/ads/lost/{id}/resolve-found`)
 * ve istemci fonksiyonu (`resolveLostAdFound`) aylardır duruyordu ama
 * <b>hiçbir ekran çağırmıyordu</b> — kayıp hayvan uygulamasında kullanıcı
 * "hayvanımı buldum" diyemiyordu. İlanı kapatmanın tek yolu "yayından kaldır"dı
 * ve o, ilanı `resolutionStatus=FOUND` yapmaz: mutlu son sayacına girmez,
 * eşleşme bağı da kurulmaz.
 *
 * <p><b>Eşleşen ilan neden sorulur:</b> sunucu `foundAdId` ile
 * `resolved_by_ad_id` alanını dolduruyor (backend #105). Bu bağ olmadan
 * "gerçekten eşleşen çiftin skoru neydi" sorusu ölçülemiyor — eşleşme eşiği de
 * bu yüzden veriyle tartışılamıyordu.
 */
export default function ResolveFoundModal({
  isOpen,
  onClose,
  ad,
  onSuccess,
}: ResolveFoundModalProps) {
  const [adaylar, setAdaylar] = useState<MatchResponseDTO[]>([]);
  const [adaylarYukleniyor, setAdaylarYukleniyor] = useState(true);
  const [secilenIlanId, setSecilenIlanId] = useState<number | null>(null);
  const [bulanKullaniciId, setBulanKullaniciId] = useState<number | undefined>();
  const [bagKurulabilir, setBagKurulabilir] = useState(false);
  const [bagUyarisi, setBagUyarisi] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hataMesaji, setHataMesaji] = useState("");

  const adId = ad?.id;

  useEffect(() => {
    if (!isOpen) return;

    const kapatmaTusu = (olay: KeyboardEvent) => {
      if (olay.key === "Escape") onClose();
    };

    const oncekiTasma = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", kapatmaTusu);

    return () => {
      document.body.style.overflow = oncekiTasma;
      window.removeEventListener("keydown", kapatmaTusu);
    };
  }, [isOpen, onClose]);

  /**
   * Pencere BAŞKA bir ilan için açıldığında seçim sıfırlanır: bir önceki
   * ilanda seçili kalan aday, kullanıcının ilanını YANLIŞ ilanla
   * eşleştirmesine yol açar (sunucu bunu göremez, iki kimlik de geçerlidir).
   *
   * Sıfırlama efektte DEĞİL render anında yapılıyor — React'in "prop değişince
   * durumu düzelt" kalıbı. Efekte konsaydı önceki ilanın seçimi bir kare
   * boyunca ekranda kalırdı; ayrıca sıfırlama, pencereyi çizen bileşenin
   * `key` vermesine bağlı olmaz, garanti bileşenin KENDİ içinde durur.
   */
  const [olculenAdId, setOlculenAdId] = useState(adId);
  if (adId !== olculenAdId) {
    setOlculenAdId(adId);
    setSecilenIlanId(null);
    setBulanKullaniciId(undefined);
    setBagKurulabilir(false);
    setBagUyarisi("");
    setHataMesaji("");
    setAdaylar([]);
    setAdaylarYukleniyor(true);
  }

  useEffect(() => {
    if (!isOpen || !adId) return;

    let gecerli = true;

    void getMyMatches()
      .then((liste) => {
        if (!gecerli) return;
        const buIlanin = (Array.isArray(liste) ? liste : []).filter(
          (satir) => ilanKimligi(satir.myAd, satir.myAdId) === adId,
        );
        buIlanin.sort((a, b) => yuzde(b.totalScore) - yuzde(a.totalScore));
        setAdaylar(buIlanin);
      })
      .catch(() => {
        // Aday listesi ÇÖKMEYE sebep olmaz: eşleşme gelmese bile kullanıcı
        // ilanını "kendim buldum" diyerek kapatabilmeli.
        if (gecerli) setAdaylar([]);
      })
      .finally(() => {
        if (gecerli) setAdaylarYukleniyor(false);
      });

    return () => {
      gecerli = false;
    };
  }, [isOpen, adId]);

  const adaySec = useCallback(
    async (partnerIlanId: number | null) => {
      setSecilenIlanId(partnerIlanId);
      setBagUyarisi("");
      setBulanKullaniciId(undefined);
      setBagKurulabilir(false);

      if (partnerIlanId === null) return;

      try {
        const partnerIlan = await getAdById(partnerIlanId);

        // Sunucu, "bulundu" tipinde OLMAYAN bir ilan gönderilirse isteğin
        // TAMAMINI reddediyor. Bağı sessizce göndermek, kullanıcının ilanını
        // kapatamamasına yol açardı; bu yüzden bağ burada düşürülüp kapanış
        // yine de mümkün kılınıyor.
        if (partnerIlan.adType !== "FOUND") {
          setBagUyarisi(
            "Bu ilan bir 'bulundu' ilanı değil, eşleşme bağı kaydedilemez. " +
              "İlanı yine de bulundu olarak kapatabilirsiniz.",
          );
          return;
        }

        setBagKurulabilir(true);
        // Ödül puanı bulan kişiye yazılıyor. Kendi bulundu ilanıyla eşleşen
        // kullanıcı, puanı KENDİNE yazdırmasın diye sahip kimliği elenmiştir.
        if (ad && partnerIlan.ownerId !== ad.ownerId) {
          setBulanKullaniciId(partnerIlan.ownerId);
        }
      } catch (hata) {
        setBagUyarisi(
          getUserErrorMessage(
            hata,
            "Eşleşen ilan okunamadı, bağ kaydedilemeyecek. İlanı yine de kapatabilirsiniz.",
          ),
        );
      }
    },
    [ad],
  );

  const gonder = async () => {
    if (!ad) return;

    const istek: ResolveLostAdRequest = {};
    if (bagKurulabilir && secilenIlanId !== null) {
      istek.foundAdId = secilenIlanId;
    }
    if (bulanKullaniciId !== undefined) {
      istek.finderId = bulanKullaniciId;
    }

    try {
      setGonderiliyor(true);
      setHataMesaji("");
      await resolveLostAdFound(ad.id, istek);
      onSuccess(ad);
      onClose();
    } catch (hata) {
      setHataMesaji(
        getUserErrorMessage(hata, "İlan bulundu olarak işaretlenemedi."),
      );
    } finally {
      setGonderiliyor(false);
    }
  };

  if (!isOpen || !ad) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-labelledby="bulundu-baslik"
        aria-modal="true"
        role="dialog"
        className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl shadow-slate-950/25"
        onMouseDown={(olay) => olay.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <PartyPopper size={24} aria-hidden="true" />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                Mutlu Son
              </span>
              <h2
                id="bulundu-baslik"
                className="mt-0.5 text-xl font-extrabold text-slate-900"
              >
                Hayvanımı Buldum
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Pencereyi kapat"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-slate-600">
            <strong className="font-bold text-slate-900">“{ad.title}”</strong>{" "}
            ilanı bulundu olarak kapatılacak ve yayından kalkacak.
          </p>

          <h3 className="mt-6 text-sm font-bold text-slate-900">
            Hangi ilan sayesinde bulundu?
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Eşleşen ilanı seçersen bulan kişiye ödül puanı verilir ve eşleşmenin
            gerçekten tuttuğu kayda geçer. Seçmeden de kapatabilirsin.
          </p>

          <div className="mt-4 space-y-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50">
              <input
                type="radio"
                name="bulundu-aday"
                className="mt-1"
                checked={secilenIlanId === null}
                onChange={() => void adaySec(null)}
              />
              <span>
                <span className="block text-sm font-bold text-slate-900">
                  Kendim buldum / eşleşen ilan yok
                </span>
                <span className="block text-xs text-slate-500">
                  İlan yalnızca bulundu olarak kapatılır.
                </span>
              </span>
            </label>

            {adaylarYukleniyor ? (
              <p className="flex items-center gap-2 px-1 py-2 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Eşleşmeler yükleniyor...
              </p>
            ) : adaylar.length === 0 ? (
              <p className="px-1 py-2 text-xs text-slate-500">
                Bu ilan için kayıtlı eşleşme yok.
              </p>
            ) : (
              adaylar.map((eslesme) => {
                const partnerId = ilanKimligi(
                  eslesme.partnerAd,
                  eslesme.partnerAdId,
                );
                if (!partnerId) return null;

                const baslik =
                  eslesme.partnerAd?.title ||
                  eslesme.partnerAdTitle ||
                  `İlan #${partnerId}`;
                const oran = yuzde(eslesme.totalScore);

                return (
                  <label
                    key={eslesme.id ?? partnerId}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name="bulundu-aday"
                      checked={secilenIlanId === partnerId}
                      onChange={() => void adaySec(partnerId)}
                    />
                    {eslesme.partnerAd?.photoUrl && (
                      <img
                        src={getImageUrl(eslesme.partnerAd.photoUrl)}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 object-cover"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-900">
                        {baslik}
                      </span>
                      <span className="block text-xs text-slate-500">
                        Eşleşme oranı %{oran}
                      </span>
                    </span>
                  </label>
                );
              })
            )}
          </div>

          {bagUyarisi && (
            <div
              className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800"
              role="status"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{bagUyarisi}</span>
            </div>
          )}

          {hataMesaji && (
            <div
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              role="alert"
            >
              {hataMesaji}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => void gonder()}
            disabled={gonderiliyor}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {gonderiliyor && <Loader2 size={16} className="animate-spin" />}
            {gonderiliyor ? "Kaydediliyor..." : "Bulundu olarak kapat"}
          </button>
        </div>
      </section>
    </div>
  );
}
