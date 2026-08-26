import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ErrorBoundary from "../components/ErrorBoundary";
import { ApiError } from "../services/api";
import {
  EN_COK_ISI_NOKTASI,
  getIsiHaritasi,
  getPanelIstatistikleri,
  yerelIsoTarihSaat,
  type IsiHaritasiNoktasi,
  type PanelIstatistikleri,
} from "../services/panelService";
import { AD_TYPE_TRANSLATIONS } from "../utils/enumTranslator";
import type { AdType } from "../services/types";

/**
 * Belediye yönetim paneli (belediye modülü, A parçası) — sayaçlar + yoğunluk
 * haritası.
 *
 * <p>İlçe SEÇTİRİLMİYOR: iki uç da kapsamı oturumdaki kurum hesabından
 * türetiyor, sunucu {@code district}'i cevapta söylüyor. Ekrandaki ilçe adı
 * bu yüzden sabit değil, istatistik cevabından geliyor.
 *
 * <p>{@code startDate}/{@code endDate} sunucuda ZORUNLU ve varsayılansız —
 * ekran açılışta son 30 günü seçili getirir, kullanıcı değiştirebilir.
 *
 * <p><b>Isı katmanı kararı:</b> depoda {@code leaflet.heat} yok ve canvas'a
 * çizdiği için jsdom'da sınanamazdı. Bunun yerine düşük opaklıklı
 * {@link CircleMarker}'lar kullanılıyor: üst üste binen dolgular yoğunluğu
 * gösteriyor, tür başına renk düz ısı lekesinin söyleyemediğini söylüyor.
 * Veri katmanı aynı; sonradan gerçek ısı katmanına geçiş yalnız render
 * değişikliği olur.
 */

const TUR_RENKLERI: Record<AdType, string> = {
  LOST: "#DC2626",
  FOUND: "#2563EB",
  ADOPTION: "#9333EA",
};

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
    <div className={`p-4 rounded-lg shadow border ${renkSinifi}`}>
      <p className="text-sm text-gray-600">{etiket}</p>
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

  const merkez = useMemo<[number, number]>(() => {
    if (noktalar.length === 0) return VARSAYILAN_MERKEZ;
    const toplam = noktalar.reduce(
      (t, n) => [t[0] + n.latitude, t[1] + n.longitude] as [number, number],
      [0, 0] as [number, number],
    );
    return [toplam[0] / noktalar.length, toplam[1] / noktalar.length];
  }, [noktalar]);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-1 text-pink-600">
        Belediye Yönetim Paneli
        {istatistik ? ` — ${istatistik.district}` : ""}
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Sayılar ve harita, kurumunuzun ilçesindeki ilanlardan türetilir.
      </p>

      <div className="flex flex-wrap items-end gap-4 mb-6 bg-gray-50 p-3 rounded border">
        <div>
          <label htmlFor="baslangic" className="block text-xs font-medium mb-1">
            Başlangıç
          </label>
          <input
            id="baslangic"
            type="date"
            className="border p-2 rounded text-sm"
            value={baslangic}
            onChange={(e) => setBaslangic(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="bitis" className="block text-xs font-medium mb-1">
            Bitiş
          </label>
          <input
            id="bitis"
            type="date"
            className="border p-2 rounded text-sm"
            value={bitis}
            onChange={(e) => setBitis(e.target.value)}
          />
        </div>
        {!araligiTersDegil && (
          <p className="pb-2 text-xs text-amber-700">
            Başlangıç tarihi bitişten sonra olamaz.
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

      {yukleniyor && (
        <p className="mb-4 text-sm text-gray-500">Panel verileri yükleniyor...</p>
      )}

      {istatistik && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SayacKarti
            etiket="Kayıp İlanları"
            deger={istatistik.lostCount}
            renkSinifi="bg-pink-50 border-pink-200 text-pink-700"
          />
          <SayacKarti
            etiket="Bulunan Hayvanlar"
            deger={istatistik.foundCount}
            renkSinifi="bg-blue-50 border-blue-200 text-blue-700"
          />
          <SayacKarti
            etiket="Sahiplendirme İlanları"
            deger={istatistik.adoptionCount}
            renkSinifi="bg-purple-50 border-purple-200 text-purple-700"
          />
          <SayacKarti
            etiket="Sahibine Kavuşanlar"
            deger={istatistik.reunionCount}
            renkSinifi="bg-green-50 border-green-200 text-green-700"
          />
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Yoğunluk Haritası
          </h3>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            {(Object.keys(TUR_RENKLERI) as AdType[]).map((tur) => (
              <span key={tur} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: TUR_RENKLERI[tur] }}
                />
                {AD_TYPE_TRANSLATIONS[tur]}
              </span>
            ))}
            <span className="text-gray-400">{noktalar.length} nokta</span>
          </div>
        </div>

        <ErrorBoundary
          title="Harita yüklenemedi."
          fallback={
            <div className="flex h-96 items-center justify-center rounded border border-dashed border-gray-300 text-sm text-gray-500">
              Harita yüklenemedi; sayılar yukarıda.
            </div>
          }
        >
          <div className="h-96 overflow-hidden rounded border border-gray-300">
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
              {noktalar.map((nokta, i) => (
                <CircleMarker
                  key={`${nokta.latitude}-${nokta.longitude}-${i}`}
                  center={[nokta.latitude, nokta.longitude]}
                  radius={14}
                  stroke={false}
                  fillColor={TUR_RENKLERI[nokta.type] ?? "#6B7280"}
                  fillOpacity={0.35}
                />
              ))}
            </MapContainer>
          </div>
        </ErrorBoundary>

        {!yukleniyor && noktalar.length === 0 && (
          <p className="mt-2 text-xs text-gray-500">
            Seçili aralıkta konumlu ilan yok.
          </p>
        )}
      </div>
    </div>
  );
}
