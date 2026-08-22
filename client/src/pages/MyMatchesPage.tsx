import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  AlertCircle,
  CirclePlus,
  Filter,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import MatchCard from "../components/MatchCard";
import ErrorBoundary from "../components/ErrorBoundary";
import { getMyMatches } from "../services/api";
import type { MatchResponseDTO } from "../services/types";
import { getUserErrorMessage } from "../utils/errorMessage";

type MatchFilter = "all" | "passed" | "low";

function MyMatchesContent() {
  const [matches, setMatches] = useState<MatchResponseDTO[]>([]);
  const [filter, setFilter] = useState<MatchFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadMatches = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await getMyMatches();
      setMatches(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(
        getUserErrorMessage(error, "Eşleşmeleriniz yüklenirken bir hata oluştu")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    void getMyMatches()
      .then((data) => {
        if (isMounted) {
          setMatches(Array.isArray(data) ? data : []);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            getUserErrorMessage(error, "Eşleşmeleriniz yüklenirken bir hata oluştu")
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMatches = matches.filter((item) => {
    if (filter === "passed") {
      return item.passedThreshold && !item.blockReason;
    }
    if (filter === "low") {
      return !item.passedThreshold || Boolean(item.blockReason);
    }
    return true;
  });

  const passedCount = matches.filter((m) => m.passedThreshold && !m.blockReason).length;
  const lowCount = matches.length - passedCount;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col justify-between">
      <div>
        <Header />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600">
                <Sparkles size={14} />
                YAPAY ZEKA EŞLEŞTİRME SYSTEMİ
              </div>

              <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Eşleşmelerim
              </h1>

              <p className="mt-2 text-base text-slate-500 max-w-2xl">
                Kayıp ve bulunan dostlarımız için yapay zeka tarafından tespit edilen olasılık ve görsel benzerlik eşleşmelerini takip edin
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void loadMatches()}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 focus:outline-none disabled:opacity-60"
              >
                <RefreshCw size={17} className={isLoading ? "animate-spin" : ""} />
                Yenile
              </button>

              <Link
                href="/lost/create"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-orange-600 focus:outline-none"
              >
                <CirclePlus size={18} />
                Yeni İlan Ver
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  filter === "all"
                    ? "bg-orange-500 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                Tümü {matches.length}
              </button>

              <button
                type="button"
                onClick={() => setFilter("passed")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  filter === "passed"
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                Yüksek İhtimal {passedCount}
              </button>

              <button
                type="button"
                onClick={() => setFilter("low")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  filter === "low"
                    ? "bg-amber-600 text-white"
                    : "bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                }`}
              >
                Düşük Engellenen {lowCount}
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Filter size={14} />
              <span>Otomatik sıralama En yüksek skor</span>
            </div>
          </div>

          {errorMessage && (
            <div
              className="mt-6 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 shadow-xs"
              role="alert"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle size={20} className="shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>

              <button
                type="button"
                onClick={() => void loadMatches()}
                className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-800 transition hover:bg-rose-200"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <SkeletonMatchCard />
              <SkeletonMatchCard />
              <SkeletonMatchCard />
              <SkeletonMatchCard />
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <Zap size={32} />
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                {filter === "all"
                  ? "Henüz Bir Eşleşme Bulunmuyor"
                  : "Bu Kriterde Eşleşme Bulunamadı"}
              </h3>

              <p className="mt-2 mx-auto max-w-md text-sm text-slate-500">
                {filter === "all"
                  ? "Sistemimiz yeni ilanları sürekli tarar ve yüksek benzerlik tespit ettiğinde burada listeler"
                  : "Filtre kriterlerinizi değiştirebilir veya tüm eşleşmeleri görüntüleyebilirsiniz"}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {filter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                  >
                    Tüm Eşleşmeleri Göster
                  </button>
                )}

                <Link
                  href="/lost/create"
                  className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
                >
                  Yeni İlan Oluştur
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {filteredMatches.map((match, index) => (
                <MatchCard key={match.id || index} match={match} />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

function SkeletonMatchCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="h-5 w-32 rounded-lg bg-slate-200" />
        <div className="h-4 w-20 rounded-lg bg-slate-200" />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-slate-200" />

          <div className="space-y-2">
            <div className="h-5 w-40 rounded-md bg-slate-200" />
            <div className="h-3 w-28 rounded-md bg-slate-200" />
          </div>
        </div>

        <div className="h-12 w-20 rounded-2xl bg-slate-200" />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="h-4 w-28 rounded-md bg-slate-200" />
        <div className="h-8 w-24 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function MyMatchesPage() {
  return (
    <ErrorBoundary title="Eşleşmelerim sayfası yüklenirken bir hata oluştu">
      <MyMatchesContent />
    </ErrorBoundary>
  );
}