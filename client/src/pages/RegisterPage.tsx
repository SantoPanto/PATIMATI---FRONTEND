import { Link } from "wouter";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-2 text-center text-4xl font-bold text-orange-500">
          🐾 PATIMATI
        </h1>

        <p className="mb-8 text-center text-slate-500">
          Yeni hesap oluştur
        </p>

        <label className="mb-2 block text-sm font-medium">
          Ad Soyad
        </label>

        <input
          type="text"
          placeholder="Ad Soyad"
          className="mb-4 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />

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
          className="mb-4 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />

        <label className="mb-2 block text-sm font-medium">
          Şifre Tekrar
        </label>

        <input
          type="password"
          placeholder="********"
          className="mb-6 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />

        <button className="mb-6 h-12 w-full rounded-xl bg-orange-500 font-semibold text-white transition-all duration-200 hover:bg-orange-600 hover:scale-[1.02] active:scale-95">
          Kayıt Ol
        </button>

        <p className="text-center text-sm text-slate-600">
          Zaten hesabın var mı?{" "}
          <Link href="/login">
            <span className="cursor-pointer font-semibold text-orange-500 hover:underline">
              Giriş Yap
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}