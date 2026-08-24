import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  PawPrint,
} from "lucide-react";
import { resetPassword } from "../services/auth";
import { getUserErrorMessage } from "../utils/errorMessage";

/**
 * E-postadaki sıfırlama bağlantısının açtığı sayfa
 * (/reset-password?token=...).
 *
 * Bu sayfa bugüne dek HİÇ yoktu: arka yüz bağlantı üretse de kullanıcının
 * gideceği bir yer olmazdı (sahipsiz "şifremi unuttum" maddesinin FE yarısı).
 * Şifre kuralları ChangePasswordPage/RegisterPage ile aynı — sunucu da aynı
 * kuralı doğruluyor (ResetPasswordRequest).
 */
export default function ResetPasswordPage() {
  // Token yalnız ilk çizimde okunur: sayfa içinde adres değişmiyor.
  const [token] = useState(
    () =>
      new URLSearchParams(window.location.search).get("token") ?? "",
  );

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validateForm = (): string | null => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      return "Lütfen bütün alanları doldurun.";
    }

    if (newPassword.length < 8) {
      return "Yeni şifre en az 8 karakter olmalıdır.";
    }

    if (newPassword.length > 20) {
      return "Yeni şifre en fazla 20 karakter olmalıdır.";
    }

    if (!/[A-ZÇĞİÖŞÜ]/.test(newPassword)) {
      return "Yeni şifre en az bir büyük harf içermelidir.";
    }

    if (!/[a-zçğıöşü]/.test(newPassword)) {
      return "Yeni şifre en az bir küçük harf içermelidir.";
    }

    if (!/[0-9]/.test(newPassword)) {
      return "Yeni şifre en az bir rakam içermelidir.";
    }

    if (newPassword !== confirmPassword) {
      return "Yeni şifreler birbiriyle eşleşmiyor.";
    }

    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsLoading(true);

      await resetPassword({ token, newPassword });

      setIsDone(true);
    } catch (error) {
      setErrorMessage(
        getUserErrorMessage(error, "Beklenmeyen bir sorun oluştu"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-orange-200/40 blur-3xl dark:bg-orange-500/10" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" />

      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-lg items-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/70 sm:p-10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40">
          <Link
            href="/login"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-orange-500 dark:text-slate-400"
          >
            <ArrowLeft size={18} />
            Giriş sayfasına dön
          </Link>

          <Link
            href="/"
            className="mb-8 flex w-fit items-center gap-3"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
              <PawPrint size={26} />
            </span>

            <span className="text-xl font-extrabold">
              PATI<span className="text-orange-500">MATI</span>
            </span>
          </Link>

          {!token ? (
            <div>
              <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Bağlantı eksik
              </h1>

              <p className="mb-8 text-slate-500 dark:text-slate-400">
                Bu sayfa yalnız e-postandaki şifre sıfırlama
                bağlantısıyla açılabilir. Bağlantının süresi 15
                dakikadır; yeni bir bağlantı isteyebilirsin.
              </p>

              <Link
                href="/forgot-password"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-orange-500 px-6 font-semibold text-white transition hover:bg-orange-600"
              >
                Yeni bağlantı iste
              </Link>
            </div>
          ) : isDone ? (
            <div>
              <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 size={28} />
              </span>

              <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Şifren güncellendi
              </h1>

              <p className="mb-8 text-slate-500 dark:text-slate-400">
                Artık yeni şifrenle giriş yapabilirsin.
              </p>

              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-orange-500 px-6 font-semibold text-white transition hover:bg-orange-600"
              >
                Giriş yap
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
                  <KeyRound size={28} />
                </span>

                <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Yeni şifreni belirle
                </h1>

                <p className="text-slate-500 dark:text-slate-400">
                  En az 8 karakter; bir büyük harf, bir küçük harf ve
                  bir rakam içermeli.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Yeni şifre
                  </label>

                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Yeni şifre (tekrar)
                  </label>

                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-orange-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                {errorMessage && (
                  <p
                    role="alert"
                    className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400"
                  >
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl bg-orange-500 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Kaydediliyor" : "Şifreyi güncelle"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
