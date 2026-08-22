import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import {
  clearAuthStorage,
  completeGoogleOAuthCallback,
  login,
  sanitizeRedirectPath,
  saveAuthResponse,
  startGoogleOAuth,
} from "../services/auth";
import { getPublicAdCounters } from "../services/ads";
import { getUserErrorMessage } from "../utils/errorMessage";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  PawPrint,
} from "lucide-react";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [counters, setCounters] = useState({ activeAds: 0, happyEndings: 0 });
  const oauthCallbackHandled = useRef(false);

  const redirectPath = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return sanitizeRedirectPath(params.get("redirect"), "/");
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadCounters = async () => {
      try {
        const data = await getPublicAdCounters();
        if (isActive) {
          setCounters(data);
        }
      } catch (error) {
        console.error("Sayaç bilgileri alınamadı:", error);
      }
    };

    void loadCounters();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (oauthCallbackHandled.current) return;

      const callbackResult = completeGoogleOAuthCallback();

      if (callbackResult.status === "none") return;

      oauthCallbackHandled.current = true;

      if (callbackResult.status === "error") {
        setErrorMessage(callbackResult.message);
        return;
      }

      const finishGoogleLogin = async () => {
        setIsOAuthLoading(true);
        setErrorMessage("");

        const currentUser = await refreshUser();

        if (!currentUser) {
          clearAuthStorage();
          setErrorMessage(
            "Google girişi tamamlandı ancak kullanıcı bilgileri alınamadı. Lütfen tekrar deneyin.",
          );
          setIsOAuthLoading(false);
          return;
        }

        navigate(callbackResult.redirectPath, { replace: true });
      };

      void finishGoogleLogin();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [navigate, refreshUser]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("E-posta ve şifre alanlarını doldurmalısın");
      return;
    }

    try {
      setIsLoading(true);

      const data = await login({
        email: email.trim(),
        password,
      });

      saveAuthResponse(data, rememberMe);
      await refreshUser();
      navigate(redirectPath);
    } catch (error) {
      setErrorMessage(
        getUserErrorMessage(error, "Giriş sırasında bir sorun oluştu"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setErrorMessage("");
    setIsOAuthLoading(true);
    startGoogleOAuth({ redirectPath, rememberMe });
  };

  const handleGuestContinue = () => {
    localStorage.setItem("userMode", "guest");
    navigate("/listings");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8">
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 lg:grid-cols-[1fr_480px]">
          <section className="relative hidden min-h-[700px] overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.32),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.25),transparent_38%)]" />

            <Link
              href="/"
              className="relative z-10 inline-flex w-fit items-center gap-3"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/30">
                <PawPrint size={26} />
              </span>

              <span className="text-xl font-extrabold tracking-tight">
                PATI<span className="text-orange-500">MATI</span>
              </span>
            </Link>

            <div className="relative z-10 max-w-lg">
              <span className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur">
                Dostlarımızı birlikte buluyoruz
              </span>

              <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
                Bir ilan
                <span className="block text-orange-500">
                  bir dostun hayatını değiştirebilir
                </span>
              </h1>

              <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">
                Kayıp ve bulunan hayvan ilanlarına ulaş yakınındaki ilanları
                haritada gör ve güvenli şekilde iletişim kur
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <strong className="block text-2xl">{counters.activeAds}</strong>
                <span className="mt-1 block text-xs text-slate-300">
                  Aktif ilan
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <strong className="block text-2xl">
                  {counters.happyEndings}
                </strong>
                <span className="mt-1 block text-xs text-slate-300">
                  Mutlu kavuşma
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <strong className="block text-2xl">81</strong>
                <span className="mt-1 block text-xs text-slate-300">
                  Şehir
                </span>
              </div>
            </div>
          </section>

          <section className="relative p-6 sm:p-10 lg:p-12">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-orange-500"
            >
              <ArrowLeft size={18} />
              Ana sayfaya dön
            </Link>

            <div className="mb-8 lg:hidden">
              <div className="mb-5 inline-flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-500 text-white">
                  <PawPrint size={24} />
                </span>

                <span className="text-xl font-extrabold">
                  PATI<span className="text-orange-500">MATI</span>
                </span>
              </div>
            </div>

            <div className="mb-8">
              <span className="text-sm font-bold uppercase tracking-wide text-orange-500">
                Hoş geldin
              </span>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Hesabına giriş yap
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                İlan oluşturmak mesajlaşmak ve bildirim almak için hesabına
                giriş yap
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || isOAuthLoading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-500 text-sm font-extrabold text-white">
                G
              </span>
              {isOAuthLoading
                ? "Google hesabı doğrulanıyor"
                : "Google ile giriş yap"}
            </button>

            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">
                veya e-posta ile
              </span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleSubmit}>
              <label
                htmlFor="login-email"
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
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ornek@mail.com"
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <label
                htmlFor="login-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Şifre
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Şifreni gir"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>

              <div className="my-5 flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-orange-500"
                  />
                  Beni hatırla
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-orange-500 transition hover:text-orange-600"
                >
                  Şifremi unuttum
                </Link>
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
                disabled={isLoading || isOAuthLoading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-orange-500 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Giriş yapılıyor" : "Giriş Yap"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleGuestContinue}
              className="mt-3 h-12 w-full rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
            >
              Misafir olarak devam et
            </button>

            <p className="mt-7 text-center text-sm text-slate-600">
              Hesabın yok mu{" "}
              <Link
                href="/register"
                className="font-bold text-orange-500 transition hover:text-orange-600"
              >
                Kayıt Ol
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}