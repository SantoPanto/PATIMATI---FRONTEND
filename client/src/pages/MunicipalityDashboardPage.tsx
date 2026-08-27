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
 * <p>İlçe SEÇTİRİLMİYOR: kapsam sunucuda oturumdaki hesaptan türetiliyor;
 * {@code district} cevapta geliyor (ilçesiz yöneticide "Tüm ilçeler").
 *
 * <p>{@code startDate}/{@code endDate} sunucuda ZORUNLU — açılışta son 30 gün.
 *
 * <p><b>Görsel dil (27.08, ikinci geri bildirim):</b> sayfa uygulamanın kendi
 * tasarım sistemine oturtuldu — {@code styles/design-system.css}'teki
 * {@code pm-*} iskeleti ve {@code --pm-*} değişkenleri. El yazması renk
 * bırakılmadı: yüzey/kenarlık/metin değişkenlerden gelir, karanlık temada
 * uygulamanın kendi tonlarına (yüzey #1e293b, turuncu #fb923c) otomatik geçer.
 * Kategori renkleri sayaç kartlarıyla hizalı; lejant tıklanabilir süzgeç.
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
    <div className="pm-card p-4">
      <p className="text-sm text-[var(--pm-muted)]">{etiket}</p>
      <p className={`text-3xl font-extrabold ${renkSinifi}`}>{deger}</p>
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
    <main className="pm-main">
      <div className="pm-container">
        <header className="pm-page-heading">
          <span className="pm-eyebrow">
            <Landmark size={14} className="mr-1 inline-block align-[-2px]" />
            Belediye
          </span>
          <h1>
            Yönetim Paneli{istatistik ? ` — ${istatistik.district}` : ""}
          </h1>
          <p>
            Sayılar ve harita, kurumunuzun kapsamındaki ilan, ihbar ve
            görülmelerden türetilir.
          </p>
        </header>

        <div className="pm-card mb-6 flex flex-wrap items-end gap-4 p-4">
          <div className="pm-field">
            <label htmlFor="baslangic" className="pm-field__label">
              Başlangıç
            </label>
            <input
              id="baslangic"
              type="date"
              className="pm-input"
              value={baslangic}
              onChange={(e) => setBaslangic(e.target.value)}
            />
          </div>
          <div className="pm-field">
            <label htmlFor="bitis" className="pm-field__label">
              Bitiş
            </label>
            <input
              id="bitis"
              type="date"
              className="pm-input"
              value={bitis}
              onChange={(e) => setBitis(e.target.value)}
            />
          </div>
          {!araligiTersDegil && (
            <p className="pb-3 text-xs text-amber-700 dark:text-amber-400">
              Başlangıç tarihi bitişten sonra olamaz.
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

        {yukleniyor && (
          <p className="mb-4 text-sm text-[var(--pm-muted)]">
            Panel verileri yükleniyor...
          </p>
        )}

        {istatistik && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SayacKarti
              etiket="Kayıp İlanları"
              deger={istatistik.lostCount}
              renkSinifi="text-pink-600 dark:text-pink-400"
            />
            <SayacKarti
              etiket="Bulunan Hayvanlar"
              deger={istatistik.foundCount}
              renkSinifi="text-blue-600 dark:text-blue-400"
            />
            <SayacKarti
              etiket="Sahiplendirme İlanları"
              deger={istatistik.adoptionCount}
              renkSinifi="text-purple-600 dark:text-purple-400"
            />
            <SayacKarti
              etiket="Sahibine Kavuşanlar"
              deger={istatistik.reunionCount}
              renkSinifi="text-green-600 dark:text-green-400"
            />
          </div>
        )}

        <section className="pm-card p-5">
          <div className="pm-card__header mb-4">
            <h2 className="pm-card__title">Yoğunluk Haritası</h2>
            <span className="text-xs text-[var(--pm-muted)]">
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
                    className={`flex items-center gap-1.5 rounded-full border border-[var(--pm-border)] bg-[var(--pm-surface)] px-3 py-1 text-xs font-bold transition hover:border-[var(--pm-primary)] ${
                      gizli
                        ? "text-[var(--pm-muted)] line-through opacity-60"
                        : "text-[var(--pm-text)]"
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
              <div className="flex h-96 items-center justify-center rounded-2xl border border-dashed border-[var(--pm-border)] text-sm text-[var(--pm-muted)]">
                Harita yüklenemedi; sayılar yukarıda.
              </div>
            }
          >
            <div className="h-96 overflow-hidden rounded-2xl border border-[var(--pm-border)]">
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
            <p className="mt-2 text-xs text-[var(--pm-muted)]">
              Seçili aralıkta konumlu kayıt yok.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
