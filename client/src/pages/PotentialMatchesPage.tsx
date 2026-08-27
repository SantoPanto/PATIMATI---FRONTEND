import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ExternalLink,
  MapPin,
  PawPrint,
  RefreshCw,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ErrorBoundary from "../components/ErrorBoundary";
import {
  decideOnMatch,
  getMyPotentialMatches,
} from "../services/potentialMatches";
import type { PotentialMatchSummaryResponse } from "../services/types";
import { hasKnownBreed } from "../utils/adPresentation";
import { getImageUrl } from "../utils/imageUrl";
import { getUserErrorMessage } from "../utils/errorMessage";

// Karar verilebilecek (henüz sonuca bağlanmamış) durumlar -- backend
// yalnızca bu durumlardaki bir kayıt için decision kabul ediyor (409
// döner aksi halde, bkz. PotentialMatchController).
const DECIDABLE_STATUSES = new Set(["PENDING", "NOTIFIED", "VIEWED"]);

function formatScorePct(score: number): number {
  if (Number.isNaN(score)) return 0;
  const pct = score <= 1 ? score * 100 : score;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

function statusLabel(status: PotentialMatchSummaryResponse["status"]): string {
  switch (status) {
    case "CONFIRMED":
      return "Onayladınız";
    case "REJECTED":
      return "Reddettiniz";
    case "EXPIRED":
      return "Süresi Doldu";
    case "NOTIFICATION_FAILED":
      return "Bildirim Gönderilemedi";
    default:
      return "Kararınızı Bekliyor";
  }
}

function PotentialMatchesContent() {
  const [matches, setMatches] = useState<PotentialMatchSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [decidingId, setDecidingId] = useState<number | null>(null);

  const loadMatches = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await getMyPotentialMatches();
      setMatches(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(
        getUserErrorMessage(error, "Olası eşleşmeleriniz yüklenirken bir hata oluştu"),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    void getMyPotentialMatches()
      .then((data) => {
        if (isMounted) {
          setMatches(Array.isArray(data) ? data : []);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            getUserErrorMessage(error, "Olası eşleşmeleriniz yüklenirken bir hata oluştu"),
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

  const handleDecision = async (
    recipientId: number,
    decision: "CONFIRMED" | "REJECTED",
  ) => {
    setDecidingId(recipientId);
    try {
      const updated = await decideOnMatch(recipientId, decision);
      setMatches((prev) =>
        prev.map((m) => (m.recipientId === recipientId ? updated : m)),
      );
    } catch (error) {
      setErrorMessage(
        getUserErrorMessage(error, "Karar kaydedilirken bir hata oluştu"),
      );
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col justify-between dark:bg-slate-950 dark:text-slate-50">
      <div>
        <Header />

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                <Sparkles size={14} />
                OLASI EŞLEŞMELER
              </div>

              <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-slate-50">
                Olası Eşleşmelerim
              </h1>

              <p className="mt-2 max-w-2xl text-base text-slate-500 dark:text-slate-400">
                İlanlarınızla eşleşebilecek diğer ilanlar ve Instagram üzerinde
                tespit edilen gönderiler burada listelenir.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadMatches()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw size={17} className={isLoading ? "animate-spin" : ""} />
              Yenile
            </button>
          </div>

          {errorMessage && (
            <div
              className="mt-6 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 shadow-xs dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
              role="alert"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle size={20} className="shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMessage}</span>
              </div>

              <button
                type="button"
                onClick={() => void loadMatches()}
                className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-800 transition hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : matches.length === 0 ? (
            <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs dark:border-slate-700 dark:bg-slate-900">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
                <Zap size={32} />
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-50">
                Henüz Bir Olası Eşleşme Bulunmuyor
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Sistemimiz yeni ilanları ve Instagram gönderilerini sürekli
                tarar, olası bir eşleşme bulduğunda burada listeler.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {matches.map((match) => (
                <PotentialMatchCard
                  key={match.recipientId}
                  match={match}
                  isDeciding={decidingId === match.recipientId}
                  onDecide={handleDecision}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

interface PotentialMatchCardProps {
  match: PotentialMatchSummaryResponse;
  isDeciding: boolean;
  onDecide: (
    recipientId: number,
    decision: "CONFIRMED" | "REJECTED",
  ) => void | Promise<void>;
}

function PotentialMatchCard({
  match,
  isDeciding,
  onDecide,
}: PotentialMatchCardProps) {
  const { counterparty } = match;
  const isExternal = counterparty.kind === "EXTERNAL";
  const scorePct = formatScorePct(match.finalScore);
  const canDecide = DECIDABLE_STATUSES.has(match.status);

  const title =
    counterparty.title ||
    (isExternal ? "Instagram'da tespit edilen gönderi" : `İlan #${counterparty.id}`);
  const subtitle = [
    counterparty.species,
    hasKnownBreed(counterparty.breed) ? counterparty.breed : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const photoUrl = getImageUrl(counterparty.photoUrl || undefined);

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-xs font-semibold dark:border-slate-800">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
            isExternal
              ? "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {isExternal ? <Camera size={13} /> : <PawPrint size={13} />}
          {isExternal ? "Instagram" : "PatiMati İlanı"}
        </span>

        <span className="text-slate-500 dark:text-slate-400">{statusLabel(match.status)}</span>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
            {counterparty.photoUrl ? (
              <img
                src={photoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                <PawPrint size={24} />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-slate-900 dark:text-slate-50">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                <MapPin size={13} className="text-slate-400 dark:text-slate-500" />
                {subtitle}
              </p>
            )}
          </div>

          <div className="ml-auto flex shrink-0 flex-col items-end rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 dark:border-slate-700 dark:bg-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Benzerlik
            </span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              %{scorePct}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          {isExternal ? (
            counterparty.sourceUrl && (
              <a
                href={counterparty.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-fuchsia-700 transition hover:text-fuchsia-800 dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
              >
                Instagram'da Görüntüle
                <ExternalLink size={13} />
              </a>
            )
          ) : (
            <Link
              href={`/pet/${counterparty.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 transition hover:text-orange-600 dark:text-slate-300 dark:hover:text-orange-400"
            >
              İlanı İncele
              <ExternalLink size={13} />
            </Link>
          )}

          {canDecide && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isDeciding}
                onClick={() => void onDecide(match.recipientId, "REJECTED")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-500/20 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <XCircle size={14} />
                Değil
              </button>
              <button
                type="button"
                disabled={isDeciding}
                onClick={() => void onDecide(match.recipientId, "CONFIRMED")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                <CheckCircle2 size={14} />
                Bu O!
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="h-5 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-2">
          <div className="h-5 w-40 rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-28 rounded-md bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

export default function PotentialMatchesPage() {
  return (
    <ErrorBoundary title="Olası eşleşmeler sayfası yüklenirken bir hata oluştu">
      <PotentialMatchesContent />
    </ErrorBoundary>
  );
}
