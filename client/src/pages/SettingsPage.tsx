import { useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Eye,
  Lock,
  Trash2,
} from "lucide-react";
import { useLocation } from "wouter";

export default function SettingsPage() {
  const [, navigate] = useLocation();

  const [openSection, setOpenSection] = useState<
    "notifications" | "privacy" | null
  >(null);

  const [notifications, setNotifications] = useState({
    messages: true,
    matches: true,
    nearbyListings: false,
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
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="mb-8 flex items-center gap-2 text-base font-medium text-slate-600 transition hover:text-orange-500"
        >
          <ChevronLeft size={20} />
          Profile dön
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-950">
            Ayarlar
          </h1>

          <p className="mt-3 text-lg text-slate-500">
            Hesap ve uygulama tercihlerini yönet.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Bildirimler */}
          <div className="border-b border-slate-100">
            <button
              type="button"
              onClick={() => toggleSection("notifications")}
              className="flex w-full items-center gap-5 px-7 py-6 text-left transition hover:bg-slate-50"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <Bell size={24} />
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-950">
                  Bildirimler
                </h2>

                <p className="mt-1 text-base text-slate-500">
                  Bildirim tercihlerini düzenle
                </p>
              </div>

              {openSection === "notifications" ? (
                <ChevronUp className="text-slate-400" size={22} />
              ) : (
                <ChevronDown className="text-slate-400" size={22} />
              )}
            </button>

            {openSection === "notifications" && (
              <div className="border-t border-slate-100 bg-slate-50 px-7 py-5">
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

                <SettingSwitch
                  title="Yakındaki ilanlar"
                  description="Yakınında yeni bir ilan oluşturulduğunda bildir."
                  checked={notifications.nearbyListings}
                  onChange={() =>
                    setNotifications((current) => ({
                      ...current,
                      nearbyListings: !current.nearbyListings,
                    }))
                  }
                  isLast
                />
              </div>
            )}
          </div>

          {/* Gizlilik */}
          <div className="border-b border-slate-100">
            <button
              type="button"
              onClick={() => toggleSection("privacy")}
              className="flex w-full items-center gap-5 px-7 py-6 text-left transition hover:bg-slate-50"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                <Eye size={24} />
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-950">
                  Gizlilik
                </h2>

                <p className="mt-1 text-base text-slate-500">
                  Profil ve konum görünürlüğünü yönet
                </p>
              </div>

              {openSection === "privacy" ? (
                <ChevronUp className="text-slate-400" size={22} />
              ) : (
                <ChevronDown className="text-slate-400" size={22} />
              )}
            </button>

            {openSection === "privacy" && (
              <div className="border-t border-slate-100 bg-slate-50 px-7 py-5">
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
            className="flex w-full items-center gap-5 border-b border-slate-100 px-7 py-6 text-left transition hover:bg-slate-50"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <Lock size={24} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Şifre değiştir
              </h2>

              <p className="mt-1 text-base text-slate-500">
                Hesap şifreni güvenli şekilde yenile
              </p>
            </div>
          </button>

          {/* Hesap silme */}
          <button
            type="button"
            className="flex w-full items-center gap-5 px-7 py-6 text-left transition hover:bg-red-50"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Trash2 size={24} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-red-600">
                Hesabı sil
              </h2>

              <p className="mt-1 text-base text-slate-500">
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
        isLast ? "" : "border-b border-slate-200"
      }`}
    >
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-orange-500" : "bg-slate-300"
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