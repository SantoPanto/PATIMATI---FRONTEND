import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Eye,
  Lock,
  MapPin,
  Trash2,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  getMyAlertSubscription,
  saveAlertSubscription,
  type AlertSubscription,
} from "../services/alerts";
import { ilIlcedenKoordinat } from "../utils/geokod";
import { konumAl, konumHataMesaji } from "../utils/konum";

export default function SettingsPage() {
  const [, navigate] = useLocation();

  const [openSection, setOpenSection] = useState<
    "notifications" | "privacy" | null
  >(null);

  const [notifications, setNotifications] = useState({
    messages: true,
    matches: true,
  });

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showPhone: false,
    showLocation: true,
  });

  const toggleSection = (
    section: "notifications" | "privacy"
  ) => {
    setOpenSection((current) =>
      current === section ? null : section
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="mb-8 flex items-center gap-2 text-base font-medium text-slate-600 transition hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400"
        >
          <ChevronLeft size={20} />
          Profile dön
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-950 dark:text-slate-50">
            Ayarlar
          </h1>

          <p className="mt-3 text-lg text-slate-500 dark:text-slate-400">
            Hesap ve uygulama tercihlerini yönet.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Bildirimler */}
          <div className="border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => toggleSection("notifications")}
              className="flex w-full items-center gap-5 px-7 py-6 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
                <Bell size={24} />
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                  Bildirimler
                </h2>

                <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                  Bildirim tercihlerini düzenle
                </p>
              </div>

              {openSection === "notifications" ? (
                <ChevronUp className="text-slate-400 dark:text-slate-500" size={22} />
              ) : (
                <ChevronDown className="text-slate-400 dark:text-slate-500" size={22} />
              )}
            </button>

            {openSection === "notifications" && (
              <div className="border-t border-slate-100 bg-slate-50 px-7 py-5 dark:border-slate-800 dark:bg-slate-800/40">
                <SettingSwitch
                  title="Yeni mesajlar"
                  description="Yeni mesaj aldığında bildirim gönder."
                  checked={notifications.messages}
                  onChange={() =>
                    setNotifications((current) => ({
                      ...current,
                      messages: !current.messages,
                    }))
                  }
                />

                <SettingSwitch
                  title="Yeni eşleşmeler"
                  description="İlanınla benzer bir hayvan bulunduğunda bildir."
                  checked={notifications.matches}
                  onChange={() =>
                    setNotifications((current) => ({
                      ...current,
                      matches: !current.matches,
                    }))
                  }
                />

                <CevreUyarilariAyari />
              </div>
            )}
          </div>

          {/* Gizlilik */}
          <div className="border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => toggleSection("privacy")}
              className="flex w-full items-center gap-5 px-7 py-6 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
                <Eye size={24} />
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                  Gizlilik
                </h2>

                <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                  Profil ve konum görünürlüğünü yönet
                </p>
              </div>

              {openSection === "privacy" ? (
                <ChevronUp className="text-slate-400 dark:text-slate-500" size={22} />
              ) : (
                <ChevronDown className="text-slate-400 dark:text-slate-500" size={22} />
              )}
            </button>

            {openSection === "privacy" && (
              <div className="border-t border-slate-100 bg-slate-50 px-7 py-5 dark:border-slate-800 dark:bg-slate-800/40">
                <SettingSwitch
                  title="Profilimi göster"
                  description="Diğer kullanıcılar profil bilgilerini görebilsin."
                  checked={privacy.showProfile}
                  onChange={() =>
                    setPrivacy((current) => ({
                      ...current,
                      showProfile: !current.showProfile,
                    }))
                  }
                />

                <SettingSwitch
                  title="Telefon numaramı göster"
                  description="İlan detayında telefon numaran görünsün."
                  checked={privacy.showPhone}
                  onChange={() =>
                    setPrivacy((current) => ({
                      ...current,
                      showPhone: !current.showPhone,
                    }))
                  }
                />

                <SettingSwitch
                  title="Yaklaşık konumumu göster"
                  description="Tam adres yerine yaklaşık konum gösterilsin."
                  checked={privacy.showLocation}
                  onChange={() =>
                    setPrivacy((current) => ({
                      ...current,
                      showLocation: !current.showLocation,
                    }))
                  }
                  isLast
                />
              </div>
            )}
          </div>

          {/* Şifre değiştirme */}
          <button
            type="button"
            onClick={() => navigate("/change-password")}
            className="flex w-full items-center gap-5 border-b border-slate-100 px-7 py-6 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Lock size={24} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                Şifre değiştir
              </h2>

              <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                Hesap şifreni güvenli şekilde yenile
              </p>
            </div>
          </button>

          {/* Hesap silme */}
          <button
            type="button"
            className="flex w-full items-center gap-5 px-7 py-6 text-left transition hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
              <Trash2 size={24} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                Hesabı sil
              </h2>

              <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                Hesabını kalıcı olarak kapat
              </p>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}

type SettingSwitchProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  isLast?: boolean;
};

function SettingSwitch({
  title,
  description,
  checked,
  onChange,
  isLast = false,
}: SettingSwitchProps) {
  return (
    <div
      className={`flex items-center justify-between gap-5 py-4 ${
        isLast ? "" : "border-b border-slate-200 dark:border-slate-800"
      }`}
    >
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-orange-500" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

/*
 * Çevre uyarıları — "seçtiğim konumun çevresinde kayıp ilanı çıkınca
 * bildirim al." Bu bölümdeki diğer anahtarların aksine yerel süs değil:
 * sunucudaki aboneliği okur/yazar (GET/PUT /api/alert-subscriptions/me,
 * kullanıcı başına tek kayıt; sunucu yalnız KAYIP ilanları bildirir ve
 * kişi başı günlük tavan uygular).
 *
 * Konum üç yolla dolar (ilan formlarındaki #102/#105 desenleri):
 * GPS · il/ilçeden geokodlama (Nominatim, asla fırlatmaz) · elle koordinat.
 */
function CevreUyarilariAyari() {
  const [abonelik, setAbonelik] = useState<AlertSubscription | null>(null);
  const [acik, setAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");

  const [enlem, setEnlem] = useState("");
  const [boylam, setBoylam] = useState("");
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [yaricap, setYaricap] = useState("10");

  useEffect(() => {
    let iptal = false;

    getMyAlertSubscription()
      .then((mevcut) => {
        if (iptal || !mevcut) {
          return;
        }
        setAbonelik(mevcut);
        setAcik(mevcut.enabled);
        setEnlem(String(mevcut.latitude));
        setBoylam(String(mevcut.longitude));
        setYaricap(String(mevcut.radiusKm));
      })
      .catch(() => {
        if (!iptal) {
          setHata("Çevre uyarısı ayarların yüklenemedi.");
        }
      })
      .finally(() => {
        if (!iptal) {
          setYukleniyor(false);
        }
      });

    return () => {
      iptal = true;
    };
  }, []);

  const sunucuyaYaz = async (govde: AlertSubscription) => {
    setKaydediliyor(true);
    setMesaj("");
    setHata("");
    try {
      const sonuc = await saveAlertSubscription(govde);
      setAbonelik(sonuc);
      setAcik(sonuc.enabled);
      setMesaj(
        sonuc.enabled
          ? "Çevre uyarıları açık — çevrende kayıp ilanı çıkınca bildirim alacaksın."
          : "Çevre uyarıları kapatıldı.",
      );
    } catch (sorun) {
      setHata(
        sorun instanceof Error && sorun.message
          ? sorun.message
          : "Ayar kaydedilemedi.",
      );
    } finally {
      setKaydediliyor(false);
    }
  };

  const anahtarDegisti = () => {
    if (yukleniyor || kaydediliyor) {
      return;
    }
    setMesaj("");
    setHata("");

    if (acik) {
      setAcik(false);
      if (abonelik) {
        void sunucuyaYaz({ ...abonelik, enabled: false });
      }
      return;
    }

    setAcik(true);
    if (abonelik) {
      // Konum zaten kayıtlı: tek dokunuşla yeniden açılır.
      void sunucuyaYaz({ ...abonelik, enabled: true });
    }
    // Abonelik yoksa panel açılır; kayıt ilk "Kaydet"te oluşur.
  };

  const konumuKullan = async () => {
    setMesaj("");
    setHata("");

    // Seçeneksiz çağrı süresiz bekleyebiliyordu; ortak yardımcı süre
    // koyuyor ve hata kodunu ayırıyor (utils/konum.ts).
    try {
      const { enlem: yeniEnlem, boylam: yeniBoylam } = await konumAl();
      setEnlem(yeniEnlem.toFixed(6));
      setBoylam(yeniBoylam.toFixed(6));
      setMesaj("Konum alındı — Kaydet'e basmayı unutma.");
    } catch (hata) {
      setHata(konumHataMesaji(hata));
    }
  };

  const ilIlcedenBul = async () => {
    setMesaj("");
    setHata("");
    const sonuc = await ilIlcedenKoordinat(il, ilce);
    if (!sonuc) {
      setHata("İl/ilçeden konum bulunamadı. Yazımı kontrol et.");
      return;
    }
    setEnlem(sonuc.latitude.toFixed(6));
    setBoylam(sonuc.longitude.toFixed(6));
    setMesaj("Konum il/ilçeden dolduruldu — Kaydet'e basmayı unutma.");
  };

  const formuKaydet = () => {
    const lat = Number(enlem.trim().replace(",", "."));
    const lng = Number(boylam.trim().replace(",", "."));
    if (
      enlem.trim() === "" ||
      boylam.trim() === "" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      setHata("Önce konum seç: GPS, il/ilçe ya da elle koordinat.");
      return;
    }
    void sunucuyaYaz({
      latitude: lat,
      longitude: lng,
      radiusKm: Number(yaricap),
      enabled: true,
    });
  };

  const girdiSinifi =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm " +
    "text-slate-900 focus:border-orange-400 focus:outline-none " +
    "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

  return (
    <div>
      <SettingSwitch
        title="Çevre uyarıları"
        description="Seçtiğin konumun çevresinde yeni bir kayıp ilanı çıkınca bildirim al."
        checked={acik}
        onChange={anahtarDegisti}
        isLast
      />

      {yukleniyor ? (
        <p className="pb-2 text-sm text-slate-400 dark:text-slate-500">Ayarların yükleniyor…</p>
      ) : (
        acik && (
          <div className="mb-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={konumuKullan}
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                <MapPin size={16} />
                Konumumu kullan
              </button>
              <span className="text-sm text-slate-400 dark:text-slate-500">
                ya da il/ilçe yaz:
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <label
                  htmlFor="cevre-il"
                  className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  İl
                </label>
                <input
                  id="cevre-il"
                  type="text"
                  value={il}
                  onChange={(olay) => setIl(olay.target.value)}
                  placeholder="Örn. Bursa"
                  className={girdiSinifi}
                />
              </div>
              <div>
                <label
                  htmlFor="cevre-ilce"
                  className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  İlçe
                </label>
                <input
                  id="cevre-ilce"
                  type="text"
                  value={ilce}
                  onChange={(olay) => setIlce(olay.target.value)}
                  placeholder="Örn. Nilüfer"
                  className={girdiSinifi}
                />
              </div>
              <div className="col-span-2 flex items-end sm:col-span-1">
                <button
                  type="button"
                  onClick={() => {
                    void ilIlcedenBul();
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-orange-400 hover:text-orange-500 dark:border-slate-700 dark:text-slate-300 dark:hover:border-orange-500/60"
                >
                  Bul
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="cevre-enlem"
                  className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  Enlem
                </label>
                <input
                  id="cevre-enlem"
                  type="text"
                  inputMode="decimal"
                  value={enlem}
                  onChange={(olay) => setEnlem(olay.target.value)}
                  placeholder="40.1928"
                  className={girdiSinifi}
                />
              </div>
              <div>
                <label
                  htmlFor="cevre-boylam"
                  className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  Boylam
                </label>
                <input
                  id="cevre-boylam"
                  type="text"
                  inputMode="decimal"
                  value={boylam}
                  onChange={(olay) => setBoylam(olay.target.value)}
                  placeholder="29.0610"
                  className={girdiSinifi}
                />
              </div>
              <div>
                <label
                  htmlFor="cevre-yaricap"
                  className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  Yarıçap
                </label>
                <select
                  id="cevre-yaricap"
                  value={yaricap}
                  onChange={(olay) => setYaricap(olay.target.value)}
                  className={girdiSinifi}
                >
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="25">25 km</option>
                  <option value="50">50 km</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={formuKaydet}
              disabled={kaydediliyor}
              className="mt-4 rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
            >
              {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        )
      )}

      {hata && <p className="pb-2 text-sm text-red-600 dark:text-red-400">{hata}</p>}
      {!hata && mesaj && (
        <p className="pb-2 text-sm text-emerald-600 dark:text-emerald-400">{mesaj}</p>
      )}
    </div>
  );
}