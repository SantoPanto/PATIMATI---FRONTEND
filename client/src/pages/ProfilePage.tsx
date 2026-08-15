import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";
import {
  Award,
  ChevronRight,
  Heart,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  PawPrint,
  Pencil,
  Phone,
  Save,
  Settings,
  Shield,
  UserRound,
  X,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import MapPicker from "../components/MapPicker";
import ErrorBoundary from "../components/ErrorBoundary";
import { useAuth } from "../contexts/AuthContext";
import { updateProfile } from "../services/auth";
import type { AuthUser } from "../services/auth";
import { getUserErrorMessage } from "../utils/errorMessage";

import "../styles/profile.css";

type EditableProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  latitude?: number;
  longitude?: number;
};

const emptyProfile: EditableProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  latitude: undefined,
  longitude: undefined,
};

function getInitials(user: AuthUser | null): string {
  if (!user) return "P";

  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ");

  if (fullName.trim()) {
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR"))
      .join("");
  }

  return user.email?.charAt(0).toLocaleUpperCase("tr-TR") || "P";
}

function ProfileContent() {
  const [, navigate] = useLocation();
  const { user, isAuthLoading, logout, refreshUser, updateUser } = useAuth();

  const initialProfile = useMemo<EditableProfile>(
    () => ({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phone:
        (typeof user?.phone === "string" && user.phone) ||
        (typeof user?.phoneNumber === "string" && user.phoneNumber) ||
        "",
      city: typeof user?.city === "string" ? user.city : "",
      latitude:
        typeof user?.latitude === "number" && !isNaN(user.latitude)
          ? user.latitude
          : undefined,
      longitude:
        typeof user?.longitude === "number" && !isNaN(user.longitude)
          ? user.longitude
          : undefined,
    }),
    [user],
  );

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditableProfile>(emptyProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "PATIMATI Kullanıcısı";

  const openEditMode = () => {
    setForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phone:
        (typeof user?.phone === "string" && user.phone) ||
        (typeof user?.phoneNumber === "string" && user.phoneNumber) ||
        "",
      city: typeof user?.city === "string" ? user.city : "",
      latitude:
        typeof user?.latitude === "number" && !isNaN(user.latitude)
          ? user.latitude
          : undefined,
      longitude:
        typeof user?.longitude === "number" && !isNaN(user.longitude)
          ? user.longitude
          : undefined,
    });
    setMessage("");
    setIsEditing(true);
  };

  const cancelEditMode = () => {
    setForm(initialProfile);
    setMessage("");
    setIsEditing(false);
  };

  const updateField = (
    field: keyof EditableProfile,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const updatedUser = await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        latitude:
          typeof form.latitude === "number" && !isNaN(form.latitude)
            ? form.latitude
            : 0,
        longitude:
          typeof form.longitude === "number" && !isNaN(form.longitude)
            ? form.longitude
            : 0,
      });

      // Instantly update AuthContext React state and LocalStorage
      updateUser(updatedUser);

      // Refresh in background if needed
      await refreshUser().catch(() => null);

      setMessage("Profil bilgileriniz başarıyla güncellendi.");
      setIsEditing(false);
    } catch (error) {
      setMessage(
        getUserErrorMessage(error, "Profil güncellenirken bir hata oluştu."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header />
        <main className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <p className="text-base text-[#64748B]">
              Profil bilgileri yükleniyor...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Header />

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-[#F97316]">
            Hesabım
          </p>

          <h1 className="mt-1 text-[32px] font-bold leading-10 text-[#0F172A]">
            Profil
          </h1>

          <p className="mt-2 text-base leading-6 text-[#64748B]">
            Kişisel bilgilerinizi ve PATIMATI hesabınızı buradan
            yönetebilirsiniz.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#FFF7ED] text-2xl font-bold text-[#F97316]">
                  {getInitials(user)}
                </div>

                <h2 className="mt-4 text-xl font-semibold leading-7">
                  {displayName}
                </h2>

                <p className="mt-1 break-all text-sm leading-5 text-[#64748B]">
                  {user?.email || "E-posta belirtilmemiş"}
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDF4] px-3 py-1 text-xs font-medium text-[#15803D]">
                    <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                    {user?.role === "ADMIN" ? "Yönetici" : "Kullanıcı"}
                  </span>

                  {typeof user?.lostBadgeLevel === "number" && user.lostBadgeLevel > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      <Award size={13} />
                      Kayıp Seviye {user.lostBadgeLevel}
                    </span>
                  )}

                  {typeof user?.adoptionBadgeLevel === "number" && user.adoptionBadgeLevel > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      <Shield size={13} />
                      Sahiplendirme Seviye {user.adoptionBadgeLevel}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={openEditMode}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-4 font-semibold text-[#0F172A] transition hover:bg-[#F1F5F9] focus:outline-none focus:ring-4 focus:ring-[#DBEAFE]"
                >
                  <Pencil size={18} />
                  Profili düzenle
                </button>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
              <ProfileMenuItem
                icon={<PawPrint size={20} />}
                label="İlanlarım"
                description="Yayınladığınız ilanları yönetin"
                onClick={() => navigate("/profile/listings")}
              />

              <ProfileMenuItem
                icon={<Heart size={20} />}
                label="Favorilerim"
                description="Kaydettiğiniz ilanları görüntüleyin"
                onClick={() => navigate("/favorites")}
              />

              <ProfileMenuItem
                icon={<MessageCircle size={20} />}
                label="Mesajlarım"
                description="İlan sahipleriyle konuşmalarınız"
                onClick={() => navigate("/chat")}
              />

              <ProfileMenuItem
                icon={<Settings size={20} />}
                label="Ayarlar"
                description="Bildirim ve gizlilik tercihleri"
                onClick={() => navigate("/settings")}
                isLast
              />
            </section>
          </aside>

          <div className="space-y-6">
            <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold leading-7">
                    Kişisel bilgiler
                  </h2>

                  <p className="mt-1 text-sm leading-5 text-[#64748B]">
                    İletişim ve hesap bilgileriniz.
                  </p>
                </div>

                {!isEditing && (
                  <button
                    type="button"
                    onClick={openEditMode}
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#F97316] transition hover:bg-[#FFF7ED] focus:outline-none focus:ring-4 focus:ring-[#FED7AA]"
                  >
                    <Pencil size={16} />
                    Düzenle
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <ProfileInput
                    label="Ad"
                    value={form.firstName}
                    onChange={(value) => updateField("firstName", value)}
                    autoComplete="given-name"
                  />

                  <ProfileInput
                    label="Soyad"
                    value={form.lastName}
                    onChange={(value) => updateField("lastName", value)}
                    autoComplete="family-name"
                  />

                  <ProfileInput
                    label="E-posta"
                    type="email"
                    value={form.email}
                    onChange={(value) => updateField("email", value)}
                    autoComplete="email"
                  />

                  <ProfileInput
                    label="Telefon"
                    type="tel"
                    value={form.phone}
                    onChange={(value) => updateField("phone", value)}
                    placeholder="05xx xxx xx xx"
                    autoComplete="tel"
                  />

                  <div className="sm:col-span-2">
                    <ProfileInput
                      label="Şehir"
                      value={form.city}
                      onChange={(value) => updateField("city", value)}
                      placeholder="Örn. Kocaeli"
                      autoComplete="address-level2"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <MapPicker
                      latitude={form.latitude}
                      longitude={form.longitude}
                      onChange={(lat, lng) => {
                        setForm((current) => ({
                          ...current,
                          latitude: lat,
                          longitude: lng,
                        }));
                      }}
                    />
                  </div>

                  {message && (
                    <p
                      className="rounded-xl bg-[#F0FDF4] px-4 py-3 text-sm text-[#15803D] sm:col-span-2"
                      role="status"
                    >
                      {message}
                    </p>
                  )}

                  <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={cancelEditMode}
                      disabled={isSaving}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-4 font-semibold text-[#0F172A] transition hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X size={18} />
                      Vazgeç
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 font-semibold text-white transition hover:bg-[#EA580C] focus:outline-none focus:ring-4 focus:ring-[#FED7AA] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save size={18} />

                      {isSaving
                        ? "Kaydediliyor..."
                        : "Değişiklikleri kaydet"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <InfoItem
                    icon={<UserRound size={20} />}
                    label="Ad Soyad"
                    value={displayName}
                  />

                  <InfoItem
                    icon={<Mail size={20} />}
                    label="E-posta"
                    value={user?.email || "Belirtilmemiş"}
                  />

                  <InfoItem
                    icon={<Phone size={20} />}
                    label="Telefon"
                    value={
                      (typeof user?.phone === "string" && user.phone.trim()) ||
                      (typeof user?.phoneNumber === "string" &&
                        user.phoneNumber.trim()) ||
                      "Belirtilmemiş"
                    }
                  />

                  <InfoItem
                    icon={<MapPin size={20} />}
                    label="Şehir"
                    value={
                      typeof user?.city === "string" && user.city
                        ? user.city
                        : "Belirtilmemiş"
                    }
                  />

                  <div className="sm:col-span-2 mt-2">
                    <MapPicker
                      latitude={user?.latitude}
                      longitude={user?.longitude}
                      readOnly
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-xl font-semibold leading-7">
                Hesap güvenliği
              </h2>

              <p className="mt-1 text-sm leading-5 text-[#64748B]">
                Şifrenizi ve oturum bilgilerinizi yönetin.
              </p>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => navigate("/change-password")}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#E2E8F0] p-4 text-left transition hover:border-[#CBD5E1] hover:bg-[#F8FAFC] focus:outline-none focus:ring-4 focus:ring-[#DBEAFE]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#3B82F6]">
                    <LockKeyhole size={20} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <strong className="block text-base font-semibold">
                      Şifre değiştir
                    </strong>

                    <span className="mt-1 block text-sm text-[#64748B]">
                      Hesap şifrenizi güvenli şekilde yenileyin.
                    </span>
                  </span>

                  <ChevronRight
                    size={20}
                    className="shrink-0 text-[#94A3B8]"
                  />
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEF2F2] px-4 font-semibold text-[#DC2626] transition hover:bg-[#FEE2E2] focus:outline-none focus:ring-4 focus:ring-[#FECACA]"
                >
                  <LogOut size={20} />
                  Çıkış Yap
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ErrorBoundary title="Profil sayfası yüklenirken bir sorun oluştu.">
      <ProfileContent />
    </ErrorBoundary>
  );
}

type ProfileInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel";
  placeholder?: string;
  autoComplete?: string;
};

function ProfileInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}: ProfileInputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#0F172A]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-xl border border-[#CBD5E1] bg-white px-4 text-base text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#F97316] focus:ring-4 focus:ring-[#FED7AA]"
      />
    </label>
  );
}

type InfoItemProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <span className="mt-0.5 shrink-0 text-[#64748B]">
        {icon}
      </span>

      <div className="min-w-0">
        <span className="block text-xs leading-4 text-[#64748B]">
          {label}
        </span>

        <strong className="mt-1 block truncate text-sm font-semibold text-[#0F172A]">
          {value}
        </strong>
      </div>
    </div>
  );
}

type ProfileMenuItemProps = {
  icon: ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  isLast?: boolean;
};

function ProfileMenuItem({
  icon,
  label,
  description,
  onClick,
  isLast = false,
}: ProfileMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 p-4 text-left transition hover:bg-[#F8FAFC] focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[#DBEAFE] ${
        isLast ? "" : "border-b border-[#E2E8F0]"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#F97316]">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <strong className="block text-sm font-semibold text-[#0F172A]">
          {label}
        </strong>

        <span className="mt-1 block truncate text-xs text-[#64748B]">
          {description}
        </span>
      </span>

      <ChevronRight
        size={20}
        className="shrink-0 text-[#94A3B8]"
      />
    </button>
  );
}