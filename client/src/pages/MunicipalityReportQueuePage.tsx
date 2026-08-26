import { useEffect, useState } from "react";
import { ApiError } from "../services/api";
import {
  getMunicipalityReports,
  updateReportStatus,
  type AnimalReport,
  type ReportStatus,
  type ReportType,
} from "../services/reportService";

/**
 * Belediye ihbar kuyruğu (belediye modülü, C parçası).
 *
 * <p>Kurum ya da yönetici hesabıyla açılır. İlçe kapsamı İSTEKTEN GELMEZ —
 * sunucu oturumdaki hesaptan türetir; bu yüzden burada ilçe seçtirilmiyor.
 *
 * <p>Liste Spring {@code Page<>} sarmalıyla döner ({@code content} alanı),
 * durum güncellemesi sorgu parametresiyle gider — ikisi de
 * {@code services/reportService.ts} içinde sarmalı; burada yeni istek yazılmaz.
 *
 * <p>Tarih süzgeci bilerek yok: uçta tarih parametresi tanımlı değil ve sayfa
 * içi süzgeç yalnız o sayfayı süzeceği için yanıltıcı olurdu.
 */

const SAYFA_BOYU = 20;

const TUR_ETIKETLERI: Record<ReportType, string> = {
  YARALI: "Yaralı hayvan",
  SAHIPSIZ: "Sahipsiz hayvan",
  DIGER: "Diğer",
};

function DurumRozeti({ durum }: { durum: ReportStatus }) {
  switch (durum) {
    case "YENI":
      return (
        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
          Yeni İhbar
        </span>
      );
    case "ISLEME_ALINDI":
      return (
        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
          İşleme Alındı
        </span>
      );
    case "TAMAMLANDI":
      return (
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-1">Belediye İhbar Kuyruğu</h1>
      <p className="text-sm text-gray-600 mb-4">
        Vatandaş ihbarları, konumlarının ilçesine göre bu kuyruğa düşer.
      </p>

      <div className="flex flex-wrap items-end gap-4 mb-4 bg-gray-50 p-3 rounded border">
        <div>
          <label
            htmlFor="durum-suzgeci"
            className="block text-xs font-medium mb-1"
          >
            Duruma Göre Filtrele
          </label>
          <select
            id="durum-suzgeci"
            className="border p-2 rounded text-sm"
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
          <p className="text-xs text-gray-500 pb-2">
            Toplam {toplamKayit} ihbar
          </p>
        )}
      </div>

      {hata && (
        <div
          role="alert"
          className="mb-4 rounded border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {hata}
        </div>
      )}

      {yukleniyor ? (
        <p className="p-4 text-center text-gray-500">İhbarlar yükleniyor...</p>
      ) : (
        <div className="border rounded overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
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
                    <tr key={kayit.id} className="border-b hover:bg-gray-50 align-top">
                      <td className="p-3 text-sm">#{kayit.id}</td>
                      <td className="p-3 text-sm font-medium">
                        {TUR_ETIKETLERI[kayit.type] ?? kayit.type}
                      </td>
                      <td className="p-3 text-sm max-w-xs">
                        {kayit.note && <p className="mb-1">{kayit.note}</p>}
                        {kayit.reporterContact && (
                          <p className="text-xs text-gray-500">
                            İletişim: {kayit.reporterContact}
                          </p>
                        )}
                        {kayit.photoUrl && (
                          <a
                            href={kayit.photoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 underline"
                          >
                            Fotoğrafı aç
                          </a>
                        )}
                      </td>
                      <td className="p-3 text-sm">{kayit.district ?? "—"}</td>
                      <td className="p-3 text-sm whitespace-nowrap">
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
                            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                  <td colSpan={7} className="p-4 text-center text-gray-500">
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
            className="rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Önceki
          </button>
          <span className="text-sm text-gray-600">
            Sayfa {sayfa + 1} / {toplamSayfa}
          </span>
          <button
            type="button"
            disabled={sayfa + 1 >= toplamSayfa}
            onClick={() => setSayfa((s) => s + 1)}
            className="rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}
