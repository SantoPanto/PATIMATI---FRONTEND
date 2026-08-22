import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { TeamShell, TeamBack } from "../components/TeamUI";
import { useAuth } from "../contexts/AuthContext";
import {
  clearAuthStorage,
  completeGoogleOAuthCallback,
} from "../services/auth";

export default function LoginRedirectPage() {
  const [, navigate] = useLocation();
  const { refreshUser } = useAuth();
  const [message, setMessage] = useState("Giriş doğrulanıyor...");
  const callbackHandled = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (callbackHandled.current) return;

      callbackHandled.current = true;
      const callbackResult = completeGoogleOAuthCallback();

      if (callbackResult.status === "none") {
        setMessage("Giriş bilgisi bulunamadı.");
        return;
      }

      if (callbackResult.status === "error") {
        setMessage(callbackResult.message);
        return;
      }

      const finishLogin = async () => {
        const currentUser = await refreshUser();

        if (!currentUser) {
          clearAuthStorage();
          setMessage("Kullanıcı bilgileri alınamadı. Lütfen tekrar deneyin.");
          return;
        }

        setMessage("Giriş yapıldı. Yönlendiriliyorsunuz...");
        navigate(callbackResult.redirectPath, { replace: true });
      };

      void finishLogin();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [navigate, refreshUser]);

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack />
        <h1>Giriş</h1>
      </header>

      <main style={{ padding: 20 }}>
        <p>{message}</p>
        <p>
          Eğer otomatik yönlendirme olmazsa <a href="/">ana sayfaya dönün</a>.
        </p>
      </main>
    </TeamShell>
  );
}
