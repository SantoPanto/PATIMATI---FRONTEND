import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  PawPrint,
  ShieldCheck,
} from "lucide-react";

import { changePassword } from "../services/auth";
import { getUserErrorMessage } from "../utils/errorMessage";

type PasswordField =
  | "currentPassword"
  | "newPassword"
  | "confirmPassword";

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const initialForm: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ChangePasswordPage() {
  const [, navigate] = useLocation();

  const [form, setForm] = useState<PasswordForm>(initialForm);

  const [visibleFields, setVisibleFields] = useState<
    Record<PasswordField, boolean>
  >({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const updateField = (
    field: PasswordField,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const toggleVisibility = (field: PasswordField) => {
    setVisibleFields((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const validateForm = (): string | null => {
    if (
      !form.currentPassword.trim() ||
      !form.newPassword.trim() ||
      !form.confirmPassword.trim()
    ) {
      return "Lütfen bütün alanları doldurun.";
    }

    if (form.newPassword.length < 8) {
      return "Yeni şifre en az 8 karakter olmalıdır.";
    }

    if (form.newPassword.length > 20) {
      return "Yeni şifre en fazla 20 karakter olmalıdır.";
    }

    if (!/[A-ZÇĞİÖŞÜ]/.test(form.newPassword)) {
      return "Yeni şifre en az bir büyük harf içermelidir.";
    }

    if (!/[a-zçğıöşü]/.test(form.newPassword)) {
      return "Yeni şifre en az bir küçük harf içermelidir.";
    }

    if (!/[0-9]/.test(form.newPassword)) {
      return "Yeni şifre en az bir rakam içermelidir.";
    }

    if (form.newPassword !== form.confirmPassword) {
      return "Yeni şifreler birbiriyle eşleşmiyor.";
    }

    if (form.currentPassword === form.newPassword) {
      return "Yeni şifre mevcut şifreden farklı olmalıdır.";
    }

    return null;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      setSuccessMessage(
        "Şifreniz başarıyla güncellendi. Profil sayfasına yönlendiriliyorsunuz.",
      );

      setForm(initialForm);

      window.setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (error) {
      setErrorMessage(
        getUserErrorMessage(error, "Şifre değiştirilirken bir hata oluştu."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordRules = [
    {
      label: "En az 8 karakter",
      valid: form.newPassword.length >= 8,
    },
    {
      label: "En fazla 20 karakter",
      valid:
        form.newPassword.length > 0 &&
        form.newPassword.length <= 20,
    },
    {
      label: "En az bir büyük harf",
      valid: /[A-ZÇĞİÖŞÜ]/.test(form.newPassword),
    },
    {
      label: "En az bir küçük harf",
      valid: /[a-zçğıöşü]/.test(form.newPassword),
    },
    {
      label: "En az bir rakam",
      valid: /[0-9]/.test(form.newPassword),
    },
  ];

  const passwordsMatch =
    form.confirmPassword.length > 0 &&
    form.newPassword === form.confirmPassword;

  const passwordsDoNotMatch =
    form.confirmPassword.length > 0 &&
    form.newPassword !== form.confirmPassword;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
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
              PATI
              <span className="text-[#F97316]">
                MATI
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A] focus:outline-none focus:ring-4 focus:ring-[#DBEAFE]"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">
              Profile dön
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6">
          <p className="text-sm font-medium text-[#F97316]">
            Hesap güvenliği
          </p>

          <h1 className="mt-1 text-3xl font-bold leading-10">
            Şifre değiştir
          </h1>

          <p className="mt-2 text-base leading-6 text-[#64748B]">
            Hesabını korumak için güçlü ve daha önce
            kullanmadığın bir şifre belirle.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="border-b border-[#E2E8F0] bg-[#FFF7ED] p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#F97316] shadow-sm">
                <ShieldCheck size={24} />
              </span>

              <div>
                <h2 className="text-lg font-semibold">
                  Güvenliğini koru
                </h2>

                <p className="mt-1 text-sm leading-5 text-[#64748B]">
                  Şifreni başka kişilerle paylaşma ve farklı
                  hesaplarda aynı şifreyi kullanmamaya çalış.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-5 sm:p-6"
          >
            <PasswordInput
              label="Mevcut şifre"
              value={form.currentPassword}
              visible={visibleFields.currentPassword}
              onChange={(value) =>
                updateField("currentPassword", value)
              }
              onToggleVisibility={() =>
                toggleVisibility("currentPassword")
              }
              autoComplete="current-password"
              placeholder="Mevcut şifrenizi girin"
              icon={<LockKeyhole size={20} />}
            />

            <PasswordInput
              label="Yeni şifre"
              value={form.newPassword}
              visible={visibleFields.newPassword}
              onChange={(value) =>
                updateField("newPassword", value)
              }
              onToggleVisibility={() =>
                toggleVisibility("newPassword")
              }
              autoComplete="new-password"
              placeholder="Yeni şifrenizi girin"
              icon={<KeyRound size={20} />}
            />

            <PasswordInput
              label="Yeni şifre tekrar"
              value={form.confirmPassword}
              visible={visibleFields.confirmPassword}
              onChange={(value) =>
                updateField("confirmPassword", value)
              }
              onToggleVisibility={() =>
                toggleVisibility("confirmPassword")
              }
              autoComplete="new-password"
              placeholder="Yeni şifrenizi tekrar girin"
              icon={<KeyRound size={20} />}
            />

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-sm font-semibold">
                Şifre gereksinimleri
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {passwordRules.map((rule) => (
                  <div
                    key={rule.label}
                    className={`flex items-center gap-2 text-sm ${
                      rule.valid
                        ? "text-[#15803D]"
                        : "text-[#64748B]"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        rule.valid
                          ? "bg-[#DCFCE7] text-[#15803D]"
                          : "bg-[#E2E8F0] text-[#94A3B8]"
                      }`}
                    >
                      <Check size={13} />
                    </span>

                    {rule.label}
                  </div>
                ))}
              </div>
            </div>

            {passwordsDoNotMatch && (
              <p
                className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#DC2626]"
                role="alert"
              >
                Yeni şifreler birbiriyle eşleşmiyor.
              </p>
            )}

            {passwordsMatch && (
              <p
                className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-medium text-[#15803D]"
                role="status"
              >
                Yeni şifreler eşleşiyor.
              </p>
            )}

            {errorMessage && (
              <p
                className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#DC2626]"
                role="alert"
              >
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p
                className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-medium text-[#15803D]"
                role="status"
              >
                {successMessage}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-[#E2E8F0] pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                disabled={isSubmitting}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#CBD5E1] bg-white px-5 font-semibold transition hover:bg-[#F1F5F9] focus:outline-none focus:ring-4 focus:ring-[#DBEAFE] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Vazgeç
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 font-semibold text-white transition hover:bg-[#EA580C] focus:outline-none focus:ring-4 focus:ring-[#FED7AA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldCheck size={19} />

                {isSubmitting
                  ? "Şifre güncelleniyor..."
                  : "Şifreyi güncelle"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

type PasswordInputProps = {
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  autoComplete: string;
  placeholder: string;
  icon: ReactNode;
};

function PasswordInput({
  label,
  value,
  visible,
  onChange,
  onToggleVisibility,
  autoComplete,
  placeholder,
  icon,
}: PasswordInputProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#0F172A]">
        {label}
      </span>

      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#94A3B8]">
          {icon}
        </span>

        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-[#CBD5E1] bg-white pl-12 pr-12 text-base text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#F97316] focus:ring-4 focus:ring-[#FED7AA]"
        />

        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#64748B] transition hover:text-[#0F172A] focus:outline-none"
          aria-label={
            visible ? "Şifreyi gizle" : "Şifreyi göster"
          }
        >
          {visible ? (
            <EyeOff size={20} />
          ) : (
            <Eye size={20} />
          )}
        </button>
      </div>
    </label>
  );
}