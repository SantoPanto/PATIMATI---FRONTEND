import { useEffect, useState } from "react";
import {
  BellOff,
  ExternalLink,
  PawPrint,
  Sparkles,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { TeamBack, TeamButton, TeamShell } from "../components/TeamUI";
import {
  decideOnMatch,
  getMyPotentialMatches,
} from "../services/potentialMatches";
import type {
  PotentialMatchDecision,
  PotentialMatchSummaryResponse,
} from "../services/types";
import { getUserErrorMessage } from "../utils/errorMessage";

const DECIDABLE_STATUSES = new Set(["PENDING", "NOTIFIED", "VIEWED"]);

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getCategoryLabel(
  category: PotentialMatchSummaryResponse["counterparty"]["category"],
): string {
  switch (category) {
    case "LOST":
      return "Kayıp";
    case "FOUND":
      return "Bulunan";
    case "ADOPTION":
      return "Sahiplendirme";
    default:
      return "Instagram kaydı";
  }
}

function getAdTypeLabel(
  adType: PotentialMatchSummaryResponse["counterparty"]["adType"],
): string {
  switch (adType) {
    case "LOST":
      return "Kayıp";
    case "FOUND":
      return "Bulunan";
    case "ADOPTION":
      return "Sahiplendirme";
    default:
      return "İlan";
  }
}

function getHedgedDescription(
  match: PotentialMatchSummaryResponse,
): string {
  if (match.counterparty.kind === "EXTERNAL") {
    return "Instagram'dan alınan bir kayıt, ilanınızdaki hayvana benziyor. Kesin bir eşleşme değildir — kaydı inceleyip aynı hayvan olup olmadığını siz değerlendirebilirsiniz.";
  }

  return "Evcil hayvanınıza benzeyen bir ilan tespit ettik. Kesin bir eşleşme değildir — ilanı inceleyip aynı hayvan olup olmadığını siz değerlendirebilirsiniz.";
}

function getStatusLabel(status: PotentialMatchSummaryResponse["status"]): string {
  switch (status) {
    case "CONFIRMED":
      return "Onayladınız";
    case "REJECTED":
      return "Uygun değil işaretlediniz";
    case "EXPIRED":
      return "Süresi doldu";
    case "NOTIFICATION_FAILED":
      return "Bildirim iletilemedi";
    default:
      return status;
  }
}

function MatchCard({
  match,
  onDecide,
  deciding,
}: {
  match: PotentialMatchSummaryResponse;
  onDecide: (recipientId: number, decision: PotentialMatchDecision) => void;
  deciding: boolean;
}) {
  const { counterparty } = match;
  const isExternal = counterparty.kind === "EXTERNAL";
  const scorePercent = Math.round(match.finalScore * 100);
  const canDecide = DECIDABLE_STATUSES.has(match.status);

  const title = isExternal
    ? getCategoryLabel(counterparty.category)
    : counterparty.title || "İlan";

  const detailHref = !isExternal ? `/pet/${counterparty.id}` : undefined;

  return (
    <article className="content-card">
      <div className="content-card__top">
        <div className="flex items-center gap-2">
          <span className="pill pill--warning inline-flex items-center gap-1">
            {isExternal ? (
              <>
                <Sparkles size={13} />
                Instagram kaydı
              </>
            ) : (
              <>
                <PawPrint size={13} />
                {getAdTypeLabel(counterparty.adType)}
              </>
            )}
          </span>

          <span className="muted text-xs">%{scorePercent} benzerlik</span>
        </div>

        <span className="muted text-xs">{formatDateTime(match.createdAt)}</span>
      </div>

      <div className="flex gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#FFF7ED]">
          {counterparty.photoUrl ? (
            <img
              src={counterparty.photoUrl}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#F97316]">
              <PawPrint size={28} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate">{title}</h3>
          {!isExternal && counterparty.species && (
            <p className="muted text-sm">
              {counterparty.species}
              {counterparty.breed ? ` · ${counterparty.breed}` : ""}
            </p>
          )}
          <p className="text-sm">{getHedgedDescription(match)}</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {canDecide ? (
          <>
            <TeamButton
              disabled={deciding}
              onClick={() => onDecide(match.recipientId, "CONFIRMED")}
            >
              Bu benim hayvanım
            </TeamButton>

            <TeamButton
              variant="outline"
              disabled={deciding}
              onClick={() => onDecide(match.recipientId, "REJECTED")}
            >
              <span className="inline-flex items-center gap-1">
                <X size={15} />
                Bu değil
              </span>
            </TeamButton>
          </>
        ) : (
          <span className="pill">{getStatusLabel(match.status)}</span>
        )}

        {isExternal && counterparty.sourceUrl ? (
          <a
            href={counterparty.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button button--outline inline-flex items-center gap-1"
          >
            <ExternalLink size={15} />
            Instagram'da görüntüle
          </a>
        ) : detailHref ? (
          <Link href={detailHref} className="button button--outline">
            İlanı görüntüle
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export default function NotificationsPage() {
  const [matches, setMatches] = useState<PotentialMatchSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decidingId, setDecidingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    getMyPotentialMatches()
      .then((data) => {
        if (!cancelled) {
          setMatches(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getUserErrorMessage(err, "Bildirimler yüklenemedi."));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDecide = (
    recipientId: number,
    decision: PotentialMatchDecision,
  ) => {
    setDecidingId(recipientId);

    decideOnMatch(recipientId, decision)
      .then((updated) => {
        setMatches((current) =>
          current.map((item) =>
            item.recipientId === recipientId ? updated : item,
          ),
        );
      })
      .catch((err) => {
        setError(getUserErrorMessage(err, "İşlem tamamlanamadı."));
      })
      .finally(() => {
        setDecidingId(null);
      });
  };

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/profile" />
        <h1>Bildirimler</h1>
      </header>

      <section className="card-stack">
        {loading && <p className="muted">Bildirimler yükleniyor...</p>}

        {error && <p className="muted">{error}</p>}

        {!loading && !error && matches.length === 0 && (
          <article className="content-card">
            <div className="content-card__top">
              <BellOff size={18} />
            </div>
            <h3>Henüz bildiriminiz yok</h3>
            <p>Yeni bildirimleriniz burada listelenecek.</p>
          </article>
        )}

        {!loading &&
          !error &&
          matches.map((match) => (
            <MatchCard
              key={match.recipientId}
              match={match}
              onDecide={handleDecide}
              deciding={decidingId === match.recipientId}
            />
          ))}
      </section>
    </TeamShell>
  );
}
