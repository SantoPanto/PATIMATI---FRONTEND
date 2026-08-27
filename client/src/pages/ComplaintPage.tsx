import { useEffect, useState } from "react";
import { Link } from "wouter";
import { FileWarning, Megaphone, ShieldOff, UserRound } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { ApiError } from "../services/api";
import { getMyComplaints, type MyComplaint } from "../services/complaints";
import { translateEnum } from "../utils/enumTranslator";

/**
 * "Şikayetlerim" (S7, 27.08): kullanıcının açtığı şikayetler ve durumları.
 *
 * <p>Bu sayfa bugüne dek statik bir taslaktı — hiçbir uca bağlı değildi ve
 * hep "şikayetiniz yok" diyordu; kullanıcı şikayetinin akıbetini göremiyordu.
 * Artık {@code GET /api/complaints/mine} birleşik listesine bağlı.
 */

const TUR_GORUNUMU: Record<
  MyComplaint["tur"],
  { etiket: string; Ikon: typeof UserRound }
> = {
  KULLANICI: { etiket: "Kullanıcı şikayeti", Ikon: UserRound },
  ILAN: { etiket: "İlan şikayeti", Ikon: Megaphone },
  SAHIPLENDIRME: { etiket: "Sahiplendirme şikayeti", Ikon: FileWarning },
};

function DurumRozeti({ durum }: { durum: MyComplaint["status"] }) {
  const sinif =
    durum === "COZULDU"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400"
      : durum === "INCELEMEDE"
        ? "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400"
        : "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${sinif}`}>
      {translateEnum(durum, "complaintStatus")}
    </span>
  );
}

/** İlana bağlı şikayetler ilgili ilana bağlantı verir; kullanıcı şikayeti vermez. */
function hedefYolu(sikayet: MyComplaint): string | null {
  if (sikayet.tur === "ILAN") return `/pet/${sikayet.hedefId}`;
  if (sikayet.tur === "SAHIPLENDIRME") return `/adoption/${sikayet.hedefId}`;
  return null;
}

export default function ComplaintPage() {
  const [sikayetler, setSikayetler] = useState<MyComplaint[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    let iptal = false;
    getMyComplaints()
      .then((liste) => {
        if (!iptal) setSikayetler(liste);
      })
      .catch((e) => {
        if (iptal) return;
        setHata(
          e instanceof ApiError && e.message
            ? e.message
            : "Şikayetler yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.",
        );
      });
    return () => {
      iptal = true;
    };
  }, []);

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/profile" />
        <h1>Şikayetlerim</h1>
      </header>

      <div className="hero-card">
        <div>
          <p className="eyebrow">Güvenli deneyim</p>
          <h2>Şikayetlerinin akıbeti burada</h2>
          <p>
            İlan, mesaj ya da kullanıcı davranışıyla ilgili yeni şikayetlerini
            ilgili ilan veya kullanıcı sayfasındaki "Şikayet Et" butonundan
            iletebilirsin; açtıkların ve durumları aşağıda listelenir.
          </p>
        </div>
      </div>

      {hata && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
        >
          {hata}
        </div>
      )}

      {!hata && sikayetler === null && (
        <p className="p-4 text-center text-sm opacity-70">
          Şikayetler yükleniyor...
        </p>
      )}

      {sikayetler !== null && sikayetler.length === 0 && (
        <section className="card-stack">
          <article className="content-card">
            <div className="content-card__top">
              <ShieldOff size={18} />
            </div>
            <h3>Kayıtlı şikayet bulunamadı</h3>
            <p>Oluşturduğunuz şikayetler burada listelenecek.</p>
          </article>
        </section>
      )}

      {sikayetler !== null && sikayetler.length > 0 && (
        <section className="card-stack">
          {sikayetler.map((sikayet) => {
            const { etiket, Ikon } = TUR_GORUNUMU[sikayet.tur];
            const yol = hedefYolu(sikayet);
            return (
              <article key={`${sikayet.tur}-${sikayet.id}`} className="content-card">
                <div className="content-card__top">
                  <Ikon size={18} />
                  <DurumRozeti durum={sikayet.status} />
                </div>

                <h3>{etiket}</h3>
                <p className="text-sm font-semibold">
                  {translateEnum(sikayet.reason, "complaintReason")}
                </p>

                {sikayet.description && <p>{sikayet.description}</p>}

                <p className="text-xs opacity-70">
                  {new Date(sikayet.createdAt).toLocaleString("tr-TR", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>

                {yol && (
                  <Link href={yol} className="text-sm font-bold underline">
                    Şikayet edilen ilana git
                  </Link>
                )}
              </article>
            );
          })}
        </section>
      )}
    </TeamShell>
  );
}
