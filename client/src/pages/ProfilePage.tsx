import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Bell,
  ChevronRight,
  Heart,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  PawPrint,
  Save,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import type { AuthUser } from "../services/auth";

type EditableProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
};

const emptyProfile: EditableProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
};

function getInitials(user: AuthUser | null): string {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  if (fullName) {
    return fullName
      .split(" ")
      .slice(0, 2)
      .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR"))
      .join("");
  }

  return user?.email?.charAt(0).toLocaleUpperCase("tr-TR") || "P";
}

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isAuthLoading, logout } = useAuth();

  const initialProfile = useMemo<EditableProfile>(
    () => ({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: typeof user?.phone === "string" ? user.phone : "",
      city: typeof user?.city === "string" ? user.city : "",
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
    setForm(initialProfile);
    setMessage("");
    setIsEditing(true);
  };

  const cancelEditMode = () => {
    setForm(initialProfile);
    setMessage("");
    setIsEditing(false);
  };

  const updateField = (field: keyof EditableProfile, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      /*
        Backend profil güncelleme endpoint'i hazır olduğunda burayı aktif et:

        const token = localStorage.getItem("accessToken");

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/users/me`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(form),
          },
        );

        if (!response.ok) {
          throw new Error("Profil güncellenemedi.");
        }
      */

      await new Promise((resolve) => setTimeout(resolve, 500));
      setMessage("Profil bilgilerin kaydedildi.");
      setIsEditing(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Profil güncellenirken bir hata oluştu.",
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
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-16">
        <div className="mx-auto max-w-[1200px] rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <p className="text-base text-[#64748B]">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  /*if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF7ED] text-[#F97316]">
            <UserRound size={32} />
          </div>

          <h1 className="mt-6 text-2xl font-bold leading-8 text-[#0F172A]">
            Profilini görüntülemek için giriş yap
          </h1>

          <p className="mt-3 text-base leading-6 text-[#64748B]">
            İlanlarını, favorilerini ve hesap bilgilerini yönetmek için hesabına
            giriş yapmalısın.
          </p>

          <Link
            href="/login?redirect=%2Fprofile"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#F97316] px-4 font-semibold text-white transition hover:bg-[#EA580C] focus:outline-none focus:ring-4 focus:ring-[#FED7AA]"
          >
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }*/

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-[#0F172A] md:pb-10">
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-[#0F172A]"
            aria-label="PATIMATI ana sayfa"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#F97316]">
              <PawPrint size={24} />
            </span>
            <span className="text-xl">
              PATI<span className="text-[#F97316]">MATI</span>
            </span>
          </Link>

          <button
            type="button"
            aria-label="Bildirimleri aç"
            onClick={() => navigate("/notifications")}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition hover:bg-[#F1F5F9] focus:outline-none focus:ring-4 focus:ring-[#DBEAFE]"
          >
            <Bell size={20} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#EF4444]" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-[#F97316]">Hesabım</p>
          <h1 className="mt-1 text-[32px] font-bold leading-10 text-[#0F172A]">
            Profil
          </h1>
          <p className="mt-2 text-base leading-6 text-[#64748B]">
            Kişisel bilgilerini ve PATIMATI hesabını buradan yönetebilirsin.
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

                <p className="mt-1 text-sm leading-5 text-[#64748B]">
                  {user?.email}
                </p>

                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#F0FDF4] px-3 py-1.5 text-sm font-medium text-[#15803D]">
                  <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                  Aktif hesap
                </span>

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
                description="Yayınladığın ilanları yönet"
                onClick={() => navigate("/profile/listings")}
              />

              <ProfileMenuItem
                icon={<Heart size={20} />}
                label="Favorilerim"
                description="Kaydettiğin ilanları görüntüle"
                onClick={() => navigate("/favorites")}
              />

              <ProfileMenuItem
                icon={<MessageCircle size={20} />}
                label="Mesajlarım"
                description="İlan sahipleriyle konuşmaların"
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
                    İletişim ve hesap bilgilerin.
                  </p>
                </div>

                {!isEditing && (
                  <button
                    type="button"
                    onClick={openEditMode}
                    className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#F97316] transition hover:bg-[#FFF7ED] focus:outline-none focus:ring-4 focus:ring-[#FED7AA]"
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
                      placeholder="Örn. Bursa"
                      autoComplete="address-level2"
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
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] px-4 font-semibold transition hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-60"
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
                      {isSaving ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
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
                      typeof user?.phone === "string" && user.phone
                        ? user.phone
                        : "Belirtilmemiş"
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
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-xl font-semibold leading-7">
                Hesap güvenliği
              </h2>
              <p className="mt-1 text-sm leading-5 text-[#64748B]">
                Şifreni ve oturum bilgilerini yönet.
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
                      Hesap şifreni güvenli şekilde yenile.
                    </span>
                  </span>

                  <ChevronRight size={20} className="text-[#94A3B8]" />
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

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid h-20 grid-cols-4 border-t border-[#E2E8F0] bg-white px-2 md:hidden"
        aria-label="Mobil navigasyon"
      >
        <MobileNavItem
          href="/"
          icon={<PawPrint size={24} />}
          label="Ana Sayfa"
        />

        <MobileNavItem
          href="/listings"
          icon={<Heart size={24} />}
          label="İlanlar"
        />

        <MobileNavItem
          href="/map"
          icon={<MapPin size={24} />}
          label="Harita"
        />

        <MobileNavItem
          href="/profile"
          icon={<UserRound size={24} />}
          label="Profil"
          active
        />
      </nav>
    </div>
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
        className="h-12 w-full rounded-xl border border-[#CBD5E1] bg-white px-4 text-base text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#F97316] focus:ring-4 focus:ring-[#FED7AA] disabled:bg-[#F1F5F9]"
      />
    </label>
  );
}

type InfoItemProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <span className="mt-0.5 text-[#64748B]">{icon}</span>

      <div className="min-w-0">
        <span className="block text-xs leading-4 text-[#64748B]">{label}</span>
        <strong className="mt-1 block truncate text-sm font-semibold text-[#0F172A]">
          {value}
        </strong>
      </div>
    </div>
  );
}

type ProfileMenuItemProps = {
  icon: React.ReactNode;
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

      <ChevronRight size={20} className="text-[#94A3B8]" />
    </button>
  );
}

type MobileNavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
};

function MobileNavItem({
  href,
  icon,
  label,
  active = false,
}: MobileNavItemProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 text-xs font-medium ${
        active ? "text-[#F97316]" : "text-[#94A3B8]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}