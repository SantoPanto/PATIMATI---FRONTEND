import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  PawPrint,
  UserRound,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export default function RegisterPage() {
  const [, navigate] = useLocation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!fullName.trim() || !email.trim() || !password || !passwordRepeat) {
      setErrorMessage("Tüm alanları doldurmalısın.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    if (password !== passwordRepeat) {
      setErrorMessage("Girdiğin şifreler birbiriyle eşleşmiyor.");
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage("Kullanım koşullarını kabul etmelisin.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ?? "Hesap oluşturulurken bir sorun oluştu.",
        );
      }

      navigate("/login?registered=true");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Kayıt sırasında bir sorun oluştu.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    window.location.href =
      `${API_BASE_URL}/oauth2/authorization/google` +
      "?redirect=%2F";
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8">
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 lg:grid-cols-[1fr_500px]">
          <section className="relative hidden min-h-[760px] overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.34),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.23),transparent_38%)]" />

            <Link
              href="/"
              className="relative z-10 inline-flex w-fit items-center gap-3"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500">
                <PawPrint size={26} />
              </span>

              <span className="text-xl font-extrabold">
                PATI<span className="text-orange-500">MATI</span>
              </span>
            </Link>

            <div className="relative z-10 max-w-lg">
              <span className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80">
                PATIMATI topluluğuna katıl
              </span>

              <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
                Birlikte daha fazla
                <span className="block text-orange-500">
                  dosta ulaşabiliriz.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">
                İlan oluştur, bölgesel bildirimler al, hayvan sahipleriyle
                güvenli şekilde mesajlaş ve dostlarımızın yuvalarına
                kavuşmasına destek ol.
              </p>
            </div>

            <div className="relative z-10 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <strong className="block text-lg">
                Ücretsiz hesap oluştur
              </strong>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Kayıp, bulunan ve sahiplendirme ilanlarını tek hesaptan yönet.
              </p>
            </div>
          </section>

          <section className="p-6 sm:p-10 lg:p-12">
            <Link
              href="/"
              className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-orange-500"
            >
              <ArrowLeft size={18} />
              Ana sayfaya dön
            </Link>

            <div className="mb-7">
              <span className="text-sm font-bold uppercase tracking-wide text-orange-500">
                Ücretsiz kayıt
              </span>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Yeni hesap oluştur
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Birkaç bilgiyle PATIMATI topluluğuna katıl.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-500 text-sm font-extrabold text-white">
                G
              </span>
              Google ile devam et
            </button>

            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">
                veya bilgilerini gir
              </span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleSubmit}>
              <label
                htmlFor="register-name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Ad Soyad
              </label>

              <div className="relative mb-4">
                <UserRound
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="register-name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Adın ve soyadın"
                  autoComplete="name"
                  className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <label
                htmlFor="register-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                E-posta
              </label>

              <div className="relative mb-4">
                <Mail
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ornek@mail.com"
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <label
                htmlFor="register-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Şifre
              </label>

              <div className="relative mb-4">
                <LockKeyhole
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="En az 8 karakter"
                  autoComplete="new-password"
                  className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-12 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>

              <label
                htmlFor="register-password-repeat"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Şifre tekrar
              </label>

              <div className="relative mb-5">
                <LockKeyhole
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="register-password-repeat"
                  type={showPassword ? "text" : "password"}
                  value={passwordRepeat}
                  onChange={(event) => setPasswordRepeat(event.target.value)}
                  placeholder="Şifreni tekrar gir"
                  autoComplete="new-password"
                  className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <label className="mb-5 flex cursor-pointer items-start gap-3 text-sm leading-5 text-slate-600">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-orange-500"
                />

                <span>
                  Kullanım koşullarını ve gizlilik politikasını kabul ediyorum.
                </span>
              </label>

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
                className="h-12 w-full rounded-xl bg-orange-500 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600">
              Zaten hesabın var mı?{" "}
              <Link
                href="/login"
                className="font-bold text-orange-500 hover:text-orange-600"
              >
                Giriş Yap
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}