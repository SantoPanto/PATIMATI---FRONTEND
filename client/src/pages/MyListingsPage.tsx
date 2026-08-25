import {
  Archive,
  CalendarDays,
  ChevronRight,
  CirclePlus,
  Eye,
  MapPin,
  PartyPopper,
  PawPrint,
  RotateCcw,
  Settings,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";

import Footer from "../components/Footer";
import Header from "../components/Header";
import PosterSettingsModal from "../components/PosterSettingsModal";
import ResolveFoundModal from "../components/ResolveFoundModal";
import { deleteAd, getMyAds, republishAd } from "../services/ads";
import type { AdResponse } from "../services/types";
import {
  getAdDetailPath,
  getAdImage,
  getAdLocation,
  getAdTypeLabel,
  getBreedLabel,
  getRelativeDate,
  getSpeciesLabel,
} from "../utils/adPresentation";
import { getUserErrorMessage } from "../utils/errorMessage";

type ListingFilter = "all" | "active" | "inactive";

export default function MyListingsPage() {
  const [filter, setFilter] = useState<ListingFilter>("all");
  const [ads, setAds] = useState<AdResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successNotification, setSuccessNotification] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [republishingId, setRepublishingId] = useState<number | null>(null);
  const [posterModalAd, setPosterModalAd] = useState<AdResponse | null>(null);
  const [bulunduModalAd, setBulunduModalAd] = useState<AdResponse | null>(null);

  const requestAds = useCallback(
    () =>
      getMyAds({
        active: filter === "all" ? undefined : filter === "active",
        page: 0,
        size: 100,
      }),
    [filter],
  );

  useEffect(() => {
    let isActive = true;

    void requestAds()
      .then((page) => {
        if (isActive) setAds(page.content);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(
            getUserErrorMessage(error, "İlanlarınız yüklenemedi."),
          );
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [requestAds]);

  const selectFilter = (nextFilter: ListingFilter) => {
    setIsLoading(true);
    setErrorMessage("");
    setFilter(nextFilter);
  };

  const handleDelete = async (ad: AdResponse) => {
    const confirmed = window.confirm(
      `“${ad.title}” ilanını yayından kaldırmak istediğinize emin misiniz?`,
    );
    if (!confirmed) return;

    try {
      setDeletingId(ad.id);
      await deleteAd(ad.id);
      const page = await requestAds();
      setAds(page.content);
    } catch (error) {
      setErrorMessage(
        getUserErrorMessage(error, "İlan yayından kaldırılamadı."),
      );
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Yayından kaldırılmış ilanı geri yayına alır.
   *
   * Yayından kaldırmanın aksine ONAY SORULMUYOR: bu işlem yıkıcı değil ve
   * kullanıcı yanlışlıkla basarsa aynı karttaki "yayından kaldır" ile tek
   * tıkta geri alabiliyor. Onay sormak, geri alınabilir bir işlemde sürtünme
   * üretir.
   */
  const handleRepublish = async (ad: AdResponse) => {
    try {
      setRepublishingId(ad.id);
      setErrorMessage("");
      await republishAd(ad.id);
      const page = await requestAds();
      setAds(page.content);
    } catch (error) {
      // Yönetici tarafından askıya alınmış ilanlarda sunucu 403 döner; bu
      // beklenen bir durum, kullanıcıya sunucunun kendi cümlesi gösteriliyor.
      setErrorMessage(
        getUserErrorMessage(error, "İlan yeniden yayınlanamadı."),
      );
    } finally {
      setRepublishingId(null);
    }
  };

  /**
   * Kayip ilani "bulundu" olarak kapandiginda listeyi sunucudan tazeler.
   *
   * Yerelde alan guncellemek YETMEZ: sunucu ilani pasiflestiriyor ve
   * `resolutionStatus` yaziyor; ikincisini `AdResponse` hic tasimiyor. Yerel
   * kopyayi elle duzeltmek, ekranin sunucudan farkli bir gercegi gostermesine
   * yol acardi.
   */
  const handleResolvedFound = (resolvedAd: AdResponse) => {
    setSuccessNotification(
      `“${resolvedAd.title}” ilanı bulundu olarak kapatıldı. Mutlu sonlar!`,
    );
    setTimeout(() => {
      setSuccessNotification("");
    }, 4000);

    void requestAds()
      .then((page) => setAds(page.content))
      .catch((error: unknown) => {
        setErrorMessage(
          getUserErrorMessage(error, "İlan listesi yenilenemedi."),
        );
      });
  };

  const handlePosterSettingsUpdate = (updatedAd: AdResponse) => {
    setAds((currentAds) =>
      currentAds.map((item) =>
        item.id === updatedAd.id ? { ...item, ...updatedAd } : item,
      ),
    );
    setSuccessNotification(`“${updatedAd.title}” ilanının afiş ayarları başarıyla kaydedildi.`);
    setTimeout(() => {
      setSuccessNotification("");
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="text-sm font-bold text-orange-500">PROFİLİM</span>
            <h1 className="mt-1 text-3xl font-bold">İlanlarım</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Oluşturduğunuz ilanları görüntüleyin ve yönetin.
            </p>
          </div>

          <Link
            href="/lost/create"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600"
          >
            <CirclePlus size={19} />
            Yeni İlan Oluştur
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
          <FilterButton active={filter === "all"} onClick={() => selectFilter("all")}>Tümü</FilterButton>
          <FilterButton active={filter === "active"} onClick={() => selectFilter("active")}>Yayında</FilterButton>
          <FilterButton active={filter === "inactive"} onClick={() => selectFilter("inactive")}>Yayından Kaldırılan</FilterButton>
        </div>

        {successNotification && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400" role="status">
            {successNotification}
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400" role="alert">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <Status title="İlanlarınız yükleniyor" description="Lütfen bekleyin..." />
        ) : ads.length === 0 ? (
          <Status
            title="Bu bölümde ilan yok"
            description="Yeni bir ilan oluşturarak dostlarımıza yardımcı olabilirsiniz."
          />
        ) : (
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {ads.map((ad) => (
              <article key={ad.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Link href={getAdDetailPath(ad)} className="relative block h-56 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img src={getAdImage(ad)} alt={ad.title} className="h-full w-full object-cover transition duration-300 hover:scale-105" loading="lazy" />
                  <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold ${ad.active ? "bg-emerald-500 text-white" : "bg-slate-700 text-white"}`}>
                    {ad.active
                      ? "Yayında"
                      : ad.suspended
                        ? "İnceleme altında"
                        : ad.resolutionStatus === "FOUND"
                          ? "Bulundu 🎉"
                          : ad.resolutionStatus === "ADOPTED"
                            ? "Sahiplendirildi 🎉"
                            : "Yayından kaldırıldı"}
                  </span>
                </Link>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wide text-orange-500">{getAdTypeLabel(ad.adType)}</span>
                      <h2 className="mt-1 text-xl font-bold">{ad.title}</h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{getSpeciesLabel(ad.species)} · {getBreedLabel(ad.breed)}</p>
                    </div>
                    <PawPrint className="shrink-0 text-orange-400" size={24} />
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                    <p className="flex items-center gap-2"><MapPin size={16} />{getAdLocation(ad)}</p>
                    <p className="flex items-center gap-2"><CalendarDays size={16} />{getRelativeDate(ad.createdAt)}</p>
                  </div>

                  <div className="mt-5 grid grid-cols-[1fr_auto_auto] gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <Link
                      href={getAdDetailPath(ad)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
                    >
                      <Eye size={17} />
                      Görüntüle
                      <ChevronRight size={16} />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setPosterModalAd(ad)}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      aria-label="Afiş Ayarları"
                      title="Afiş Ayarları"
                    >
                      <Settings size={18} />
                    </button>

                    {ad.active ? (
                      <button
                        type="button"
                        onClick={() => void handleDelete(ad)}
                        disabled={deletingId === ad.id}
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                        aria-label="İlanı yayından kaldır"
                      >
                        <Trash2 size={18} />
                      </button>
                    ) : ad.suspended ? (
                      /* ASKIDAKİ İLANDA DÜĞME ÇİZİLMEZ. Yönetici askıya
                         alırken hem suspended hem active yazıyor, yani askıya
                         alınan ilan da bu sekmeye düşüyor. Burada `active`e
                         bakıp düğme çizilirse kullanıcı HER ZAMAN reddedilecek
                         bir düğmeye basar (uç suspended'ı görüp 403 veriyor) ve
                         ekranda sebep görünmez — ilanının incelemede olduğunu
                         hiçbir yerden öğrenemez. */
                      <span
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
                        title="İlanınız yönetici incelemesinde. İnceleme bitene kadar yeniden yayınlanamaz."
                      >
                        <ShieldAlert size={17} />
                        İnceleme altında
                      </span>
                    ) : ad.resolutionStatus === "FOUND" ||
                      ad.resolutionStatus === "ADOPTED" ? (
                      /* ÇÖZÜLMÜŞ İLANDA "YENİDEN YAYINLA" ÇİZİLMEZ. Hayvan
                         bulunduysa ilanın geri açılması istenen bir şey değil;
                         düğme orada dururken kullanıcı mutlu sonla kapanmış
                         ilanı yeniden yayına alabiliyordu (ölçüldü, 21.08
                         canlı). Sunucu bunu engellemiyor — `republishAd`
                         yalnız `active` ve `suspended`e bakıyor. */
                      <span
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                        title="Bu ilan mutlu sonla kapandı."
                      >
                        <PartyPopper size={17} />
                        Kapandı
                      </span>
                    ) : (
                      /* Yayından kaldırılan ilanda önceden YALNIZ "Görüntüle"
                         vardı; ilan yaşam döngüsü tek yönlüydü ve kullanıcı
                         ilanını geri getiremiyordu. */
                      <button
                        type="button"
                        onClick={() => void handleRepublish(ad)}
                        disabled={republishingId === ad.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 px-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                        aria-label="İlanı yeniden yayınla"
                      >
                        <RotateCcw size={17} />
                        {republishingId === ad.id
                          ? "Yayınlanıyor..."
                          : "Yeniden yayınla"}
                      </button>
                    )}
                  </div>

                  {/* Yalniz KAYIP ve YAYINDA olan ilanda cizilir: sunucu
                      (AdService.resolveLostAd) uc kosulu da ariyor — sahiplik,
                      aktiflik, LOST tipi. Askidaki ilan `active=false`
                      oldugundan burada zaten gorunmez; kosul genisletilirse
                      kullanici HER ZAMAN reddedilecek bir dugmeye basar. */}
                  {ad.adType === "LOST" && ad.active && (
                    <button
                      type="button"
                      onClick={() => setBulunduModalAd(ad)}
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/15"
                    >
                      <PartyPopper size={17} />
                      Hayvanımı buldum
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <PosterSettingsModal
          isOpen={Boolean(posterModalAd)}
          onClose={() => setPosterModalAd(null)}
          ad={posterModalAd}
          onSuccess={handlePosterSettingsUpdate}
        />

        <ResolveFoundModal
          isOpen={Boolean(bulunduModalAd)}
          onClose={() => setBulunduModalAd(null)}
          ad={bulunduModalAd}
          onSuccess={handleResolvedFound}
        />
      </main>

      <Footer />
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-bold transition ${active ? "bg-orange-500 text-white" : "bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-600 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"}`}
    >
      {children}
    </button>
  );
}

function Status({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900" role="status">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
        <Archive size={28} />
      </span>
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}
