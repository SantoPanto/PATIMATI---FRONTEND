import { useEffect, useState } from "react";
import { Inbox, MapPin } from "lucide-react";
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ApiError } from "../services/api";
import ErrorBoundary from "../components/ErrorBoundary";
import MunicipalityNav from "../components/MunicipalityNav";
import {
  getMunicipalityReports,
  updateReportStatus,
  type AnimalReport,
  type ReportStatus,
  type ReportType,
} from "../services/reportService";
import { getImageUrl } from "../utils/imageUrl";

/**
 * Belediye ihbar kuyruğu (belediye modülü, C parçası).
 *
 * <p>Kurum ya da yönetici hesabıyla açılır. İlçe kapsamı İSTEKTEN GELMEZ —
 * sunucu oturumdaki hesaptan türetir (ilçesiz yönetici tüm kuyruğu görür).
 *
 * <p>Liste Spring {@code Page<>} sarmalıyla döner ({@code content} alanı),
 * durum güncellemesi sorgu parametresiyle gider — ikisi de
 * {@code services/reportService.ts} içinde sarmalı.
 *
 * <p>Tarih süzgeci bilerek yok: uçta tarih parametresi tanımlı değil ve sayfa
 * içi süzgeç yalnız o sayfayı süzeceği için yanıltıcı olurdu.
 *
 * <p>Görsel dil: uygulamanın {@code pm-*} tasarım sistemi
 * ({@code styles/design-system.css}) — 27.08 ikinci geri bildirimi.
 */

const SAYFA_BOYU = 20;

const TUR_ETIKETLERI: Record<ReportType, string> = {
  YARALI: "Yaralı hayvan",
  SAHIPSIZ: "Sahipsiz hayvan",
  DIGER: "Diğer",
};

/** Panel haritasının lejantıyla AYNI kimlik renkleri (doğrulanmış üçlü). */
const TUR_RENKLERI: Record<ReportType, string> = {
  YARALI: "#EA580C",
  SAHIPSIZ: "#0D9488",
  DIGER: "#57534E",
};

function DurumRozeti({ durum }: { durum: ReportStatus }) {
  switch (durum) {
    case "YENI":
      return (
        <span className="rounded-full px-2.5 py-1 text-xs font-bold bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400">
          Yeni İhbar
        </span>
      );
    case "ISLEME_ALINDI":
      return (
        <span className="rounded-full px-2.5 py-1 text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400">
          İşleme Alındı
        </span>
      );
    case "TAMAMLANDI":
      return (
        <span className="rounded-full px-2.5 py-1 text-xs font-bold bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400">
          Tamamlandı
        </span>
      );
  }
}

/** Kuyruk akışında bir sonraki adım; TAMAMLANDI'dan sonrası yok. */
function sonrakiAdim(
  durum: ReportStatus,
): { durum: ReportStatus; etiket: string } | null {
  if (durum === "YENI") return { durum: "ISLEME_ALINDI", etiket: "İşleme al" };
  if (durum === "ISLEME_ALINDI")
    return { durum: "TAMAMLANDI", etiket: "Tamamlandı işaretle" };
  return null;
}

export default function MunicipalityReportQueuePage() {
  const [durumSuzgeci, setDurumSuzgeci] = useState<"ALL" | ReportStatus>("ALL");
  const [sayfa, setSayfa] = useState(0);
  const [kayitlar, setKayitlar] = useState<AnimalReport[]>([]);
  const [toplamSayfa, setToplamSayfa] = useState(0);
  const [toplamKayit, setToplamKayit] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [guncellenenId, setGuncellenenId] = useState<number | null>(null);
  const [surum, setSurum] = useState(0);
  const [seciliIhbar, setSeciliIhbar] = useState<AnimalReport | null>(null);

  useEffect(() => {
    let iptal = false;
    setYukleniyor(true);

    getMunicipalityReports({
      status: durumSuzgeci === "ALL" ? undefined : durumSuzgeci,
      page: sayfa,
      size: SAYFA_BOYU,
    })
      .then((cevap) => {
        if (iptal) return;
        setKayitlar(cevap.content);
        setToplamSayfa(cevap.totalPages);
        setToplamKayit(cevap.totalElements);
        setHata(null);
      })
      .catch((e) => {
        if (iptal) return;
        setHata(
          e instanceof ApiError && e.message
            ? e.message
            : "İhbarlar yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.",
        );
      })
      .finally(() => {
        if (!iptal) setYukleniyor(false);
      });

    return () => {
      iptal = true;
    };
  }, [durumSuzgeci, sayfa, surum]);

  const durumaGecir = async (id: number, durum: ReportStatus) => {
    setGuncellenenId(id);
    setHata(null);
    try {
      await updateReportStatus(id, durum);
      // Satırı yerinde değiştirmek yerine liste yeniden çekiliyor: aktif
      // süzgeçte durumu değişen kayıt listeden düşmeli, sayaçlar tutmalı.
      setSurum((s) => s + 1);
    } catch (e) {
      setHata(
        e instanceof ApiError && e.message
          ? e.message
          : "Durum güncellenemedi. Tekrar deneyin.",
      );
    } finally {
      setGuncellenenId(null);
    }
  };

  const suzgecDegisti = (deger: string) => {
    setDurumSuzgeci(deger as "ALL" | ReportStatus);
    setSayfa(0);
  };

  return (
    <main className="pm-main">
      <div className="pm-container">
        <header className="pm-page-heading">
          <span className="pm-eyebrow">
            <Inbox size={14} className="mr-1 inline-block align-[-2px]" />
            Belediye
          </span>
          <h1>İhbar Kuyruğu</h1>
          <p>Vatandaş ihbarları, konumlarının ilçesine göre bu kuyruğa düşer.</p>
        </header>

        <MunicipalityNav />

        <div className="pm-card mb-6 flex flex-wrap items-end gap-4 p-4">
          <div className="pm-field">
            <label htmlFor="durum-suzgeci" className="pm-field__label">
              Duruma Göre Filtrele
            </label>
            <select
              id="durum-suzgeci"
              className="pm-input"
              value={durumSuzgeci}
              onChange={(e) => suzgecDegisti(e.target.value)}
            >
              <option value="ALL">Tümü</option>
              <option value="YENI">Yeni</option>
              <option value="ISLEME_ALINDI">İşleme Alındı</option>
              <option value="TAMAMLANDI">Tamamlandı</option>
            </select>
          </div>
          {!yukleniyor && (
            <p className="pb-3 text-xs text-[var(--pm-muted)]">
              Toplam {toplamKayit} ihbar
            </p>
          )}
        </div>

        {hata && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            {hata}
          </div>
        )}

        {yukleniyor ? (
          <p className="p-4 text-center text-sm text-[var(--pm-muted)]">
            İhbarlar yükleniyor...
          </p>
        ) : (
          <div className="pm-card overflow-x-auto">
            <table className="w-full border-collapse text-left text-[var(--pm-text)]">
              <thead>
                <tr className="border-b border-[var(--pm-border)] bg-[var(--pm-bg)]">
                  <th className="p-3 text-sm">ID</th>
                  <th className="p-3 text-sm">Tür</th>
                  <th className="p-3 text-sm">Ayrıntı</th>
                  <th className="p-3 text-sm">İlçe</th>
                  <th className="p-3 text-sm">Tarih</th>
                  <th className="p-3 text-sm">Durum</th>
                  <th className="p-3 text-sm">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {kayitlar.length > 0 ? (
                  kayitlar.map((kayit) => {
                    const adim = sonrakiAdim(kayit.status);
                    return (
                      <tr
                        key={kayit.id}
                        className="border-b border-[var(--pm-border)] align-top last:border-b-0"
                      >
                        <td className="p-3 text-sm">#{kayit.id}</td>
                        <td className="p-3 text-sm font-bold">
                          {TUR_ETIKETLERI[kayit.type] ?? kayit.type}
                        </td>
                        <td className="max-w-xs p-3 text-sm">
                          {kayit.note && <p className="mb-1">{kayit.note}</p>}
                          {kayit.reporterContact && (
                            <p className="text-xs text-[var(--pm-muted)]">
                              İletişim: {kayit.reporterContact}
                            </p>
                          )}
                          {kayit.photoUrl && (
                            <a
                              href={getImageUrl(kayit.photoUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="mr-3 text-xs font-bold text-[var(--pm-primary)] underline"
                            >
                              Fotoğrafı aç
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setSeciliIhbar(kayit)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--pm-primary)] underline"
                          >
                            <MapPin size={12} />
                            Haritada gör
                          </button>
                        </td>
                        <td className="p-3 text-sm">{kayit.district ?? "—"}</td>
                        <td className="whitespace-nowrap p-3 text-sm">
                          {new Date(kayit.createdAt).toLocaleString("tr-TR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="p-3 text-sm">
                          <DurumRozeti durum={kayit.status} />
                        </td>
                        <td className="p-3 text-sm">
                          {adim && (
                            <button
                              type="button"
                              disabled={guncellenenId !== null}
                              onClick={() => durumaGecir(kayit.id, adim.durum)}
                              className="rounded-lg bg-[var(--pm-primary)] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[var(--pm-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {guncellenenId === kayit.id
                                ? "Güncelleniyor..."
                                : adim.etiket}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-4 text-center text-sm text-[var(--pm-muted)]"
                    >
                      {durumSuzgeci === "ALL"
                        ? "Kuyrukta ihbar yok."
                        : "Bu durumda ihbar yok."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {toplamSayfa > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={sayfa === 0}
              onClick={() => setSayfa((s) => s - 1)}
              className="pm-button pm-button--secondary"
            >
              Önceki
            </button>
            <span className="text-sm text-[var(--pm-muted)]">
              Sayfa {sayfa + 1} / {toplamSayfa}
            </span>
            <button
              type="button"
              disabled={sayfa + 1 >= toplamSayfa}
              onClick={() => setSayfa((s) => s + 1)}
              className="pm-button pm-button--secondary"
            >
              Sonraki
            </button>
          </div>
        )}
        {seciliIhbar && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`İhbar #${seciliIhbar.id} konumu`}
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSeciliIhbar(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-[var(--pm-border)] bg-[var(--pm-surface)] p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-[var(--pm-text)]">
                  İhbar #{seciliIhbar.id} —{" "}
                  {TUR_ETIKETLERI[seciliIhbar.type] ?? seciliIhbar.type}
                </h2>
                <button
                  type="button"
                  onClick={() => setSeciliIhbar(null)}
                  className="pm-button pm-button--secondary px-3 py-1 text-xs"
                >
                  Kapat
                </button>
              </div>

              <ErrorBoundary
                title="Harita yüklenemedi."
                fallback={
                  <p className="text-sm text-[var(--pm-muted)]">
                    Harita yüklenemedi; koordinatlar aşağıda.
                  </p>
                }
              >
                <div className="h-72 overflow-hidden rounded-xl border border-[var(--pm-border)]">
                  <MapContainer
                    center={[seciliIhbar.latitude, seciliIhbar.longitude]}
                    zoom={15}
                    scrollWheelZoom
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <CircleMarker
                      center={[seciliIhbar.latitude, seciliIhbar.longitude]}
                      radius={10}
                      stroke={false}
                      fillColor={TUR_RENKLERI[seciliIhbar.type] ?? "#EA580C"}
                      fillOpacity={0.85}
                    />
                  </MapContainer>
                </div>
              </ErrorBoundary>

              <p className="mt-2 text-xs text-[var(--pm-muted)]">
                {seciliIhbar.district ?? "İlçe çözülmedi"} ·{" "}
                {seciliIhbar.latitude.toFixed(5)}, {seciliIhbar.longitude.toFixed(5)}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
