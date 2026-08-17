import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  saveAuthTokens,
  clearAuthStorage,
  consumeOAuthIntent,
} from "../services/authStorage";

export default function OAuthRedirectHandler() {
  const [, navigate] = useLocation();
  const { refreshUser } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const handleOAuthCallback = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        if (error) {
          console.error("Google OAuth Hatası:", error);
          setErrorMessage("Google ile giriş yapılamadı. Lütfen tekrar deneyin.");
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 2000);
          return;
        }

        if (!token) {
          setErrorMessage("URL içerisinde doğrulama anahtarı (token) bulunamadı.");
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 2000);
          return;
        }

        // Token'ı localStorage/sessionStorage içine kaydet
        const { redirectPath, rememberMe } = consumeOAuthIntent("/");
        saveAuthTokens({ accessToken: token }, rememberMe);

        // Global Auth state'ini (AuthContext) güncelle
        const currentUser = await refreshUser();

        if (currentUser) {
          // Başarılı: Hedef sayfaya yönlendir
          navigate(redirectPath || "/", { replace: true });
        } else {
          clearAuthStorage();
          setErrorMessage("Oturum açıldı fakat kullanıcı bilgileri alınamadı.");
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 2000);
        }
      } catch (err) {
        console.error("OAuth İşleme Hatası:", err);
        clearAuthStorage();
        setErrorMessage("Giriş işlemi sırasında bir hata oluştu.");
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      }
    };

    void handleOAuthCallback();
  }, [navigate, refreshUser]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-8">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        {errorMessage ? (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Giriş Başarısız</h2>
            <p className="text-sm text-slate-600">{errorMessage}</p>
            <p className="text-xs text-slate-400">Giriş sayfasına yönlendiriliyorsunuz...</p>
          </>
        ) : (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-500">
              <Loader2 size={36} className="animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Google ile Giriş Yapılıyor</h2>
            <p className="text-sm text-slate-600">Lütfen bekleyin, oturumunuz doğrulanıyor...</p>
          </>
        )}
      </div>
    </div>
  );
}
