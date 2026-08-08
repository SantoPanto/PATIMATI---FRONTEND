import { useState } from "react";
import { Link } from "wouter";
import { resetPassword } from "../services/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await resetPassword(email);
      setSuccess(response.message ?? "Şifre sıfırlama bağlantısı gönderildi.");
      setEmail("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "İşlem başarısız oldu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-2 text-center text-4xl font-bold text-orange-500">🐾 PATIMATI</h1>

        <p className="mb-8 text-center text-slate-500">Şifreni sıfırlamak için e-posta adresini gir.</p>

        <label className="mb-2 block text-sm font-medium">E-posta</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ornek@mail.com"
          className="mb-6 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="mb-6 h-12 w-full rounded-xl bg-orange-500 font-semibold text-white transition-all duration-200 hover:bg-orange-600 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          {loading ? "Gönderiliyor..." : "Şifre Sıfırlama Bağlantısı Gönder"}
        </button>

        {error ? <p className="mb-4 text-center text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mb-4 text-center text-sm text-green-600">{success}</p> : null}

        <p className="text-center text-sm text-slate-600">
          Şifreni hatırladın mı? {" "}
          <Link href="/login">
            <span className="cursor-pointer font-semibold text-orange-500 hover:underline">Giriş Yap</span>
          </Link>
        </p>
      </form>
    </div>
  );
}
