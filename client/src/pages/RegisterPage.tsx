import { useState } from "react";
import { Link } from "wouter";
import { registerUser } from "../services/auth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);

    try {
      await registerUser(name, email, password);
      setSuccess(true);
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Kayıt işlemi başarısız oldu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-2 text-center text-4xl font-bold text-orange-500">🐾 PATIMATI</h1>

        <p className="mb-8 text-center text-slate-500">Yeni hesap oluştur</p>

        <label className="mb-2 block text-sm font-medium">Ad Soyad</label>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ad Soyad"
          className="mb-4 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          required
        />

        <label className="mb-2 block text-sm font-medium">E-posta</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ornek@mail.com"
          className="mb-4 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          required
        />

        <label className="mb-2 block text-sm font-medium">Şifre</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="********"
          className="mb-4 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          required
        />

        <label className="mb-2 block text-sm font-medium">Şifre Tekrar</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="********"
          className="mb-6 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="mb-6 h-12 w-full rounded-xl bg-orange-500 font-semibold text-white transition-all duration-200 hover:bg-orange-600 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
        </button>

        {error ? <p className="mb-4 text-center text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mb-4 text-center text-sm text-green-600">Kayıt başarılı.</p> : null}

        <p className="text-center text-sm text-slate-600">
          Zaten hesabın var mı? {" "}
          <Link href="/login">
            <span className="cursor-pointer font-semibold text-orange-500 hover:underline">Giriş Yap</span>
          </Link>
        </p>
      </form>
    </div>
  );
}
