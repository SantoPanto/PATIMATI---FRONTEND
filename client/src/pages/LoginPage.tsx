import { Link } from "wouter";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-2 text-center text-4xl font-bold text-orange-500">
          🐾 PATIMATI
        </h1>

        <p className="mb-8 text-center text-slate-500">
          Evcil dostunu bulmanın en kolay yolu
        </p>

        <label className="mb-2 block text-sm font-medium">
          E-posta
        </label>

        <input
          type="email"
          placeholder="ornek@mail.com"
          className="mb-4 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />

        <label className="mb-2 block text-sm font-medium">
          Şifre
        </label>

        <input
          type="password"
          placeholder="********"
          className="mb-2 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />

        <div className="mb-6 text-right">
          <Link href="/forgot-password">
            <span className="cursor-pointer text-sm text-orange-500 hover:underline">
              Şifremi Unuttum?
            </span>
          </Link>
        </div>

        <button className="mb-6 h-12 w-full rounded-xl bg-orange-500 font-semibold text-white transition-all duration-200 hover:bg-orange-600 hover:scale-[1.02] active:scale-95">
          Giriş Yap
        </button>

        <p className="text-center text-sm text-slate-600">
          Hesabın yok mu?{" "}
          <Link href="/register">
            <span className="cursor-pointer font-semibold text-orange-500 hover:underline">
              Kayıt Ol
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}