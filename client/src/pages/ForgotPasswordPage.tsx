import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  PawPrint,
  ShieldCheck,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("E-posta adresini girmelisin.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Şifre sıfırlama isteği gönderilirken sorun oluştu.",
        );
      }

      setIsSent(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Beklenmeyen bir sorun oluştu.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8">
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-lg items-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/70 sm:p-10">
          <Link
            href="/login"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-orange-500"
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

          {!isSent ? (
            <>
              <div className="mb-8">
                <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-500">
                  <ShieldCheck size={28} />
                </span>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Şifreni mi unuttun?
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Hesabına ait e-posta adresini gir. Şifreni yenileyebileceğin
                  güvenli bağlantıyı sana gönderelim.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <label
                  htmlFor="forgot-email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  E-posta
                </label>

                <div className="relative mb-5">
                  <Mail
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ornek@mail.com"
                    autoComplete="email"
                    className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                  >
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl bg-orange-500 px-4 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading
                    ? "Gönderiliyor..."
                    : "Şifre sıfırlama bağlantısı gönder"}
                </button>
              </form>
            </>
          ) : (
            <div className="py-6 text-center">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-50 text-green-500">
                <CheckCircle2 size={40} />
              </span>

              <h1 className="mt-6 text-3xl font-bold text-slate-900">
                E-postanı kontrol et
              </h1>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                Hesap bulunması hâlinde şifre sıfırlama bağlantısı{" "}
                <strong className="text-slate-700">{email}</strong> adresine
                gönderildi.
              </p>

              <Link
                href="/login"
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-orange-500 font-bold text-white transition hover:bg-orange-600"
              >
                Giriş sayfasına dön
              </Link>
            </div>
          )}

          {!isSent && (
            <p className="mt-7 text-center text-sm text-slate-600">
              Şifreni hatırladın mı?{" "}
              <Link
                href="/login"
                className="font-bold text-orange-500 hover:text-orange-600"
              >
                Giriş Yap
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}