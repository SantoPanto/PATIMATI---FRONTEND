import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Landmark } from "lucide-react";
import ErrorBoundary from "../components/ErrorBoundary";
import { ApiError } from "../services/api";
import {
  EN_COK_ISI_NOKTASI,
  getIsiHaritasi,
  getPanelIstatistikleri,
  yerelIsoTarihSaat,
  type IsiHaritasiNoktasi,
  type IsiKategorisi,
  type PanelIstatistikleri,
} from "../services/panelService";

/**
 * Belediye yönetim paneli (belediye modülü, A parçası) — sayaçlar + yoğunluk
 * haritası.
 *
 * <p>İlçe SEÇTİRİLMİYOR: iki uç da kapsamı oturumdaki kurum hesabından
 * türetiyor, sunucu {@code district}'i cevapta söylüyor.
 *
 * <p>{@code startDate}/{@code endDate} sunucuda ZORUNLU ve varsayılansız —
 * ekran açılışta son 30 günü seçili getirir.
 *
 * <p><b>Harita kategorileri (27.08 geri bildirimi):</b> uç artık üç kaynağı
 * birleştiriyor (ilanlar + kavuşanlar + vatandaş ihbarları + görülmeler) ve
 * 500 nokta tek yığında okunmuyordu. Lejant bu yüzden TIKLANABİLİR süzgeç:
 * kategori kapatılınca noktaları haritadan kalkar. Renkler sayaç kartlarıyla
 * hizalı; ısı katmanı kararı (CircleMarker, leaflet.heat değil) önceki
 * commit'te gerekçeli.
 */

type KategoriGorunumu = { etiket: string; renk: string };

const KATEGORI_GORUNUMU: Record<IsiKategorisi, KategoriGorunumu> = {
  LOST: { etiket: "Kayıp", renk: "#DB2777" },
  FOUND: { etiket: "Bulundu", renk: "#2563EB" },
  ADOPTION: { etiket: "Sahiplendirme", renk: "#9333EA" },
  REUNION: { etiket: "Kavuşan", renk: "#16A34A" },
  YARALI: { etiket: "Yaralı ihbarı", renk: "#EA580C" },
  SAHIPSIZ: { etiket: "Sahipsiz ihbarı", renk: "#D97706" },
  DIGER: { etiket: "Diğer ihbar", renk: "#64748B" },
  SIGHTING: { etiket: "Görülme", renk: "#0891B2" },
};

/** Sunucu yarın yeni kategori eklerse ekran kırılmasın. */
const BILINMEYEN_GORUNUM: KategoriGorunumu = { etiket: "Diğer", renk: "#94A3B8" };

function gorunum(kategori: IsiKategorisi): KategoriGorunumu {
  return KATEGORI_GORUNUMU[kategori] ?? BILINMEYEN_GORUNUM;
}

/** Kocaeli çevresi — nokta yokken haritanın açıldığı merkez (MapPicker ile aynı). */
const VARSAYILAN_MERKEZ: [number, number] = [40.8528, 29.8815];

const GIRDI_SINIFI =
  "rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] " +
  "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

function tarihGirdisiDegeri(tarih: Date): string {
  return yerelIsoTarihSaat(tarih).slice(0, 10);
}

function sonOtuzGun(): { baslangic: string; bitis: string } {
  const bugun = new Date();
  const otuzGunOnce = new Date(bugun);
  otuzGunOnce.setDate(bugun.getDate() - 30);
  return {
    baslangic: tarihGirdisiDegeri(otuzGunOnce),
    bitis: tarihGirdisiDegeri(bugun),
  };
}

/**
 * MapContainer {@code center} prop'unu YALNIZ ilk render'da okur; noktalar
 * sonradan gelince harita varsayılan merkezde kalıyordu (27.08 tarayıcı
 * ölçümü). MapPicker'daki RecenterMap ile aynı çare.
 */
function HaritayiOrtala({ merkez }: { merkez: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(merkez, map.getZoom());
  }, [merkez, map]);
  return null;
}

function SayacKarti({
  etiket,
  deger,
  renkSinifi,
}: {
  etiket: string;
  deger: number;
  renkSinifi: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${renkSinifi}`}>
      <p className="text-sm text-[#64748B] dark:text-slate-400">{etiket}</p>
      <p className="text-3xl font-bold">{deger}</p>
    </div>
  );
}

export default function MunicipalityDashboardPage() {
  const ilkAralik = useMemo(sonOtuzGun, []);
  const [baslangic, setBaslangic] = useState(ilkAralik.baslangic);
  const [bitis, setBitis] = useState(ilkAralik.bitis);

  const [istatistik, setIstatistik] = useState<PanelIstatistikleri | null>(null);
  const [noktalar, setNoktalar] = useState<IsiHaritasiNoktasi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [gizliKategoriler, setGizliKategoriler] = useState<Set<IsiKategorisi>>(
    () => new Set(),
  );

  const araligiTersDegil = baslangic <= bitis;

  useEffect(() => {
    if (!araligiTersDegil) return;

    let iptal = false;
    setYukleniyor(true);

    // Gün sınırları: başlangıç gününün başı, bitiş gününün sonu. Saat dilimi
    // eki bilerek yok — sunucu LocalDateTime bekliyor (panelService'e bak).
    const aralik = {
      startDate: `${baslangic}T00:00:00`,
      endDate: `${bitis}T23:59:59`,
    };

    Promise.all([
      getPanelIstatistikleri(aralik),
      getIsiHaritasi(aralik, EN_COK_ISI_NOKTASI),
    ])
      .then(([sayilar, harita]) => {
        if (iptal) return;
        setIstatistik(sayilar);
        setNoktalar(harita);
        setHata(null);
      })
      .catch((e) => {
        if (iptal) return;
        setHata(
          e instanceof ApiError && e.message
            ? e.message
            : "Panel verileri yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.",
        );
      })
      .finally(() => {
        if (!iptal) setYukleniyor(false);
      });

    return () => {
      iptal = true;
    };
  }, [baslangic, bitis, araligiTersDegil]);

  const kategoriSayilari = useMemo(() => {
    const sayilar = new Map<IsiKategorisi, number>();
    for (const nokta of noktalar) {
      sayilar.set(nokta.type, (sayilar.get(nokta.type) ?? 0) + 1);
    }
    return sayilar;
  }, [noktalar]);

  const gorunenNoktalar = useMemo(
    () => noktalar.filter((n) => !gizliKategoriler.has(n.type)),
    [noktalar, gizliKategoriler],
  );

  const merkez = useMemo<[number, number]>(() => {
    if (gorunenNoktalar.length === 0) return VARSAYILAN_MERKEZ;
    const toplam = gorunenNoktalar.reduce(
      (t, n) => [t[0] + n.latitude, t[1] + n.longitude] as [number, number],
      [0, 0] as [number, number],
    );
    return [toplam[0] / gorunenNoktalar.length, toplam[1] / gorunenNoktalar.length];
  }, [gorunenNoktalar]);

  const kategoriDegistir = (kategori: IsiKategorisi) => {
    setGizliKategoriler((onceki) => {
      const yeni = new Set(onceki);
      if (yeni.has(kategori)) {
        yeni.delete(kategori);
      } else {
        yeni.add(kategori);
      }
      return yeni;
    });
  };

  return (
    <div className="mx-auto my-6 max-w-6xl px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-[#0F172A] dark:text-slate-100">
          <Landmark size={24} className="text-[#F97316]" />
          Belediye Yönetim Paneli
          {istatistik ? ` — ${istatistik.district}` : ""}
        </h2>
        <p className="mt-1 mb-5 text-sm text-[#64748B] dark:text-slate-400">
          Sayılar ve harita, kurumunuzun ilçesindeki ilan, ihbar ve
          görülmelerden türetilir.
        </p>

        <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <div>
            <label
              htmlFor="baslangic"
              className="mb-1 block text-xs font-medium text-[#0F172A] dark:text-slate-200"
            >
              Başlangıç
            </label>
            <input
              id="baslangic"
              type="date"
              className={GIRDI_SINIFI}
              value={baslangic}
              onChange={(e) => setBaslangic(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="bitis"
              className="mb-1 block text-xs font-medium text-[#0F172A] dark:text-slate-200"
            >
              Bitiş
            </label>
            <input
              id="bitis"
              type="date"
              className={GIRDI_SINIFI}
              value={bitis}
              onChange={(e) => setBitis(e.target.value)}
            />
          </div>
          {!araligiTersDegil && (
            <p className="pb-2 text-xs text-amber-700 dark:text-amber-400">
              Başlangıç tarihi bitişten sonra olamaz.
            </p>
          )}
        </div>

        {hata && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            {hata}
          </div>
        )}

        {yukleniyor && (
          <p className="mb-4 text-sm text-[#64748B] dark:text-slate-400">
            Panel verileri yükleniyor...
          </p>
        )}

        {istatistik && (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <SayacKarti
              etiket="Kayıp İlanları"
              deger={istatistik.lostCount}
              renkSinifi="border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-500/20 dark:bg-pink-500/10 dark:text-pink-400"
            />
            <SayacKarti
              etiket="Bulunan Hayvanlar"
              deger={istatistik.foundCount}
              renkSinifi="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
            />
            <SayacKarti
              etiket="Sahiplendirme İlanları"
              deger={istatistik.adoptionCount}
              renkSinifi="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400"
            />
            <SayacKarti
              etiket="Sahibine Kavuşanlar"
              deger={istatistik.reunionCount}
              renkSinifi="border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-400"
            />
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
              Yoğunluk Haritası
            </h3>
            <span className="text-xs text-[#94A3B8] dark:text-slate-500">
              {gorunenNoktalar.length} nokta
            </span>
          </div>

          {kategoriSayilari.size > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {[...kategoriSayilari.entries()].map(([kategori, adet]) => {
                const gizli = gizliKategoriler.has(kategori);
                const { etiket, renk } = gorunum(kategori);
                return (
                  <button
                    key={kategori}
                    type="button"
                    aria-pressed={!gizli}
                    onClick={() => kategoriDegistir(kategori)}
                    title={
                      gizli
                        ? `${etiket} noktalarını göster`
                        : `${etiket} noktalarını gizle`
                    }
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                      gizli
                        ? "border-slate-200 bg-white text-[#94A3B8] line-through opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                        : "border-slate-300 bg-white text-[#0F172A] hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: renk }}
                    />
                    {etiket} · {adet}
                  </button>
                );
              })}
            </div>
          )}

          <ErrorBoundary
            title="Harita yüklenemedi."
            fallback={
              <div className="flex h-96 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-[#64748B] dark:border-slate-600 dark:text-slate-400">
                Harita yüklenemedi; sayılar yukarıda.
              </div>
            }
          >
            <div className="h-96 overflow-hidden rounded-xl border border-[#CBD5E1] shadow-inner dark:border-slate-700">
              <MapContainer
                center={merkez}
                zoom={12}
                scrollWheelZoom
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <HaritayiOrtala merkez={merkez} />
                {gorunenNoktalar.map((nokta, i) => (
                  <CircleMarker
                    key={`${nokta.latitude}-${nokta.longitude}-${i}`}
                    center={[nokta.latitude, nokta.longitude]}
                    radius={7}
                    stroke={false}
                    fillColor={gorunum(nokta.type).renk}
                    fillOpacity={0.3}
                  />
                ))}
              </MapContainer>
            </div>
          </ErrorBoundary>

          {!yukleniyor && noktalar.length === 0 && (
            <p className="mt-2 text-xs text-[#94A3B8] dark:text-slate-500">
              Seçili aralıkta konumlu kayıt yok.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
