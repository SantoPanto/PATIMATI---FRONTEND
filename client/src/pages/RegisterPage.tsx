import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  PawPrint,
  Phone,
  UserRound,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import {
  register,
  saveAuthResponse,
  startGoogleOAuth,
} from "../services/auth";
import { getUserErrorMessage } from "../utils/errorMessage";

// Register formundaki validasyon ve görsel kontrol listesi
// aynı parola kurallarını kullanır.
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 20;
const PASSWORD_UPPERCASE_PATTERN = /[A-ZÇĞİÖŞÜ]/;
const PASSWORD_LOWERCASE_PATTERN = /[a-zçğıöşü]/;
const PASSWORD_DIGIT_PATTERN = /[0-9]/;

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { refreshUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setErrorMessage("");

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    if (
      !normalizedFirstName ||
      !normalizedLastName ||
      !normalizedPhone ||
      !normalizedEmail ||
      !password ||
      !passwordRepeat
    ) {
      setErrorMessage("Tüm alanları doldurmalısın");
      return;
    }

    if (
      normalizedFirstName.length < 2 ||
      normalizedFirstName.length > 40
    ) {
      setErrorMessage("Ad 2 ile 40 karakter arasında olmalıdır");
      return;
    }

    if (
      normalizedLastName.length < 2 ||
      normalizedLastName.length > 40
    ) {
      setErrorMessage("Soyad 2 ile 40 karakter arasında olmalıdır");
      return;
    }

    if (
      normalizedEmail.length < 5 ||
      normalizedEmail.length > 50
    ) {
      setErrorMessage(
        "E-posta 5 ile 50 karakter arasında olmalıdır",
      );
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      setErrorMessage("Geçerli bir e-posta adresi girmelisin");
      return;
    }

    if (
      normalizedPhone.length < 9 ||
      normalizedPhone.length > 15
    ) {
      setErrorMessage(
        "Telefon numarası 9 ile 15 karakter arasında olmalıdır",
      );
      return;
    }

    const phonePattern =
      /^(?:\+90\d{10}|0\s?\d{3}\s?\d{3}\s?\d{2}\s?\d{2}|\d{10})(?:\s\+\d+)?$/;

    if (!phonePattern.test(normalizedPhone)) {
      setErrorMessage(
        "Telefon numarası formatı geçersiz. Örnek: 05551234567",
      );
      return;
    }


    if (password.length < PASSWORD_MIN_LENGTH) {
      setErrorMessage("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
      setErrorMessage("Şifre en fazla 20 karakter olmalıdır.");
      return;
    }

    if (!PASSWORD_UPPERCASE_PATTERN.test(password)) {
      setErrorMessage("Şifre en az bir büyük harf içermelidir.");
      return;
    }

    if (!PASSWORD_LOWERCASE_PATTERN.test(password)) {
      setErrorMessage("Şifre en az bir küçük harf içermelidir.");
      return;
    }

    if (!PASSWORD_DIGIT_PATTERN.test(password)) {
      setErrorMessage("Şifre en az bir rakam içermelidir.");
      return;
    }

    if (password !== passwordRepeat) {
      setErrorMessage(
        "Girdiğin şifreler birbiriyle eşleşmiyor",
      );
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage(
        "Kullanım koşullarını ve gizlilik politikasını kabul etmelisin",
      );
      return;
    }

    try {
      setIsLoading(true);

      const data = await register({
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        email: normalizedEmail,
        password,
        phone: normalizedPhone,
      });

      if (!data.token) {
        throw new Error(
          "Kayıt başarılı ancak sunucudan oturum anahtarı alınamadı",
        );
      }

      saveAuthResponse(data, true);

      await refreshUser();

      navigate("/");
    } catch (error) {
      setErrorMessage(
        getUserErrorMessage(error, "Kayıt sırasında bir sorun oluştu"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    setErrorMessage("");
    startGoogleOAuth({ redirectPath: "/", rememberMe: true });
  };

  const passwordRules = [
    {
      label: "En az 8 karakter",
      valid: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      label: "En fazla 20 karakter",
      valid:
        password.length > 0 &&
        password.length <= PASSWORD_MAX_LENGTH,
    },
    {
      label: "En az bir büyük harf",
      valid: PASSWORD_UPPERCASE_PATTERN.test(password),
    },
    {
      label: "En az bir küçük harf",
      valid: PASSWORD_LOWERCASE_PATTERN.test(password),
    },
    {
      label: "En az bir rakam",
      valid: PASSWORD_DIGIT_PATTERN.test(password),
    },
  ];

  const passwordsMatch =
    passwordRepeat.length > 0 &&
    password === passwordRepeat;

  const passwordsDoNotMatch =
    passwordRepeat.length > 0 &&
    password !== passwordRepeat;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl" />

      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 lg:grid-cols-[1fr_500px] dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40">
          <section className="relative hidden min-h-[860px] overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.34),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.23),transparent_38%)]" />

            <Link
              href="/"
              className="relative z-10 inline-flex w-fit items-center gap-3"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500">
                <PawPrint size={26} />
              </span>

              <span className="text-xl font-extrabold">
                PATI
                <span className="text-orange-500">
                  MATI
                </span>
              </span>
            </Link>

            <div className="relative z-10 max-w-lg">
              <span className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80">
                PATIMATI topluluğuna katıl
              </span>

              <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
                Birlikte daha fazla
                <span className="block text-orange-500">
                  dosta ulaşabiliriz
                </span>
              </h1>

              <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">
                İlan oluştur bölgesel bildirimler al
                hayvan sahipleriyle güvenli şekilde mesajlaş
                ve dostlarımızın yuvalarına kavuşmasına
                destek ol
              </p>
            </div>

            <div className="relative z-10 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <strong className="block text-lg">
                Ücretsiz hesap oluştur
              </strong>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Kayıp bulunan ve sahiplendirme ilanlarını
                tek hesaptan yönet
              </p>
            </div>
          </section>

          <section className="p-6 sm:p-10 lg:p-12">
            <Link
              href="/"
              className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-orange-500 dark:text-slate-400"
            >
              <ArrowLeft size={18} />
              Ana sayfaya dön
            </Link>

            <div className="mb-7">
              <span className="text-sm font-bold uppercase tracking-wide text-orange-500">
                Ücretsiz kayıt
              </span>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Yeni hesap oluştur
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Birkaç bilgiyle PATIMATI topluluğuna katıl
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-500 text-sm font-extrabold text-white">
                G
              </span>

              Google ile devam et
            </button>

            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />

              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                veya bilgilerini gir
              </span>

              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="register-first-name"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Ad
                  </label>

                  <div className="relative">
                    <UserRound
                      size={19}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="register-first-name"
                      type="text"
                      value={firstName}
                      onChange={(event) =>
                        setFirstName(event.target.value)
                      }
                      placeholder="Adın"
                      autoComplete="given-name"
                      minLength={2}
                      maxLength={40}
                      disabled={isLoading}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20 dark:disabled:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="register-last-name"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Soyad
                  </label>

                  <div className="relative">
                    <UserRound
                      size={19}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="register-last-name"
                      type="text"
                      value={lastName}
                      onChange={(event) =>
                        setLastName(event.target.value)
                      }
                      placeholder="Soyadın"
                      autoComplete="family-name"
                      minLength={2}
                      maxLength={40}
                      disabled={isLoading}
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20 dark:disabled:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              <label
                htmlFor="register-phone"
                className="mb-2 mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Telefon
              </label>

              <div className="relative mb-4">
                <Phone
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="register-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="05451133421"
                  autoComplete="tel"
                  minLength={9}
                  maxLength={15}
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20 dark:disabled:bg-slate-800"
                />
              </div>

              <label
                htmlFor="register-email"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
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
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="ornek@mail.com"
                  autoComplete="email"
                  minLength={5}
                  maxLength={50}
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20 dark:disabled:bg-slate-800"
                />
              </div>

              <label
                htmlFor="register-password"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
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
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="8-20 karakter"
                  autoComplete="new-password"
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20 dark:disabled:bg-slate-800"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed dark:hover:text-slate-200"
                  aria-label={
                    showPassword
                      ? "Şifreyi gizle"
                      : "Şifreyi göster"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Şifre gereksinimleri
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {passwordRules.map((rule) => (
                    <div
                      key={rule.label}
                      className={`flex items-center gap-2 text-sm ${
                        rule.valid
                          ? "text-green-700 dark:text-emerald-400"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          rule.valid
                            ? "bg-green-100 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                            : "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                        }`}
                      >
                        <Check size={13} />
                      </span>

                      {rule.label}
                    </div>
                  ))}
                </div>
              </div>

              <label
                htmlFor="register-password-repeat"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Şifre tekrar
              </label>

              {/* <div className="relative mb-5">
                <LockKeyhole
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="register-password-repeat"
                  type={showPassword ? "text" : "password"}
                  value={passwordRepeat}
                  onChange={(event) =>
                    setPasswordRepeat(event.target.value)
                  }
                  placeholder="Şifreni tekrar gir"
                  autoComplete="new-password"
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20 dark:disabled:bg-slate-800"
                />
              </div> */}

              <div className="mb-5">
                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="register-password-repeat"
                    type={showPassword ? "text" : "password"}
                    value={passwordRepeat}
                    onChange={(event) =>
                      setPasswordRepeat(event.target.value)
                    }
                    placeholder="Şifreni tekrar gir"
                    autoComplete="new-password"
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-500/20 dark:disabled:bg-slate-800"
                  />
                </div>

                {passwordsDoNotMatch && (
                  <p
                    className="mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-500/20 dark:bg-red-500/10 font-medium text-red-600 dark:text-red-400"
                    role="alert"
                  >
                    Şifreler birbiriyle eşleşmiyor.
                  </p>
                )}

                {passwordsMatch && (
                  <p
                    className="mt-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
                    role="status"
                  >
                    Şifreler eşleşiyor.
                  </p>
                )}
              </div>

              <label className="mb-5 flex cursor-pointer items-start gap-3 text-sm leading-5 text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) =>
                    setAcceptedTerms(event.target.checked)
                  }
                  disabled={isLoading}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-orange-500"
                />

                <span>
                  Kullanım koşullarını ve{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-orange-600 underline underline-offset-2 hover:text-orange-700"
                  >
                    gizlilik politikasını
                  </a>{" "}
                  kabul ediyorum
                </span>
              </label>

              {errorMessage && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-500/20 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                >
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-orange-500 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? "Hesap oluşturuluyor"
                  : "Kayıt Ol"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600 dark:text-slate-400">
              Zaten hesabın var mı{" "}
              <Link
                href="/login"
                className="font-bold text-orange-500 transition hover:text-orange-600"
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