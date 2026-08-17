import {
  Archive,
  CalendarDays,
  ChevronRight,
  CirclePlus,
  Eye,
  MapPin,
  PawPrint,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { deleteAd, getMyAds } from "../services/ads";
import type { AdResponse } from "../services/types";
import {
  getAdDetailPath,
  getAdImage,
  getAdLocation,
  getAdTypeLabel,
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
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="text-sm font-bold text-orange-500">PROFİLİM</span>
            <h1 className="mt-1 text-3xl font-bold">İlanlarım</h1>
            <p className="mt-2 text-slate-500">
              Oluşturduğunuz ilanları görüntüleyin ve yönetin.
            </p>
          </div>

          <Link
            href="/add-listing"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600"
          >
            <CirclePlus size={19} />
            Yeni İlan Oluştur
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          <FilterButton active={filter === "all"} onClick={() => selectFilter("all")}>Tümü</FilterButton>
          <FilterButton active={filter === "active"} onClick={() => selectFilter("active")}>Yayında</FilterButton>
          <FilterButton active={filter === "inactive"} onClick={() => selectFilter("inactive")}>Yayından Kaldırılan</FilterButton>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700" role="alert">
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
              <article key={ad.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <Link href={getAdDetailPath(ad)} className="relative block h-56 overflow-hidden bg-slate-100">
                  <img src={getAdImage(ad)} alt={ad.title} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
                  <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold ${ad.active ? "bg-emerald-500 text-white" : "bg-slate-700 text-white"}`}>
                    {ad.active ? "Yayında" : "Yayından kaldırıldı"}
                  </span>
                </Link>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wide text-orange-500">{getAdTypeLabel(ad.adType)}</span>
                      <h2 className="mt-1 text-xl font-bold">{ad.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">{getSpeciesLabel(ad.species)} · {ad.breed || "Cins belirtilmemiş"}</p>
                    </div>
                    <PawPrint className="shrink-0 text-orange-400" size={24} />
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-slate-500">
                    <p className="flex items-center gap-2"><MapPin size={16} />{getAdLocation(ad)}</p>
                    <p className="flex items-center gap-2"><CalendarDays size={16} />{getRelativeDate(ad.createdAt)}</p>
                  </div>

                  <div className="mt-5 grid grid-cols-[1fr_auto] gap-2 border-t border-slate-100 pt-4">
                    <Link
                      href={getAdDetailPath(ad)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                    >
                      <Eye size={17} />
                      Görüntüle
                      <ChevronRight size={16} />
                    </Link>
                    {ad.active && (
                      <button
                        type="button"
                        onClick={() => void handleDelete(ad)}
                        disabled={deletingId === ad.id}
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        aria-label="İlanı yayından kaldır"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
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
      className={`rounded-full px-4 py-2 text-sm font-bold transition ${active ? "bg-orange-500 text-white" : "bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-600"}`}
    >
      {children}
    </button>
  );
}

function Status({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center" role="status">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        <Archive size={28} />
      </span>
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-slate-500">{description}</p>
    </div>
  );
}
