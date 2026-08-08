import React, { useEffect, useState } from "react";
import { TeamShell, TeamBack } from "../components/TeamUI";

export default function LoginRedirectPage() {
  const [message, setMessage] = useState("Uygulanıyor...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (token) {
      localStorage.setItem("token", token);
      setMessage("Giriş yapıldı. Yönlendiriliyorsunuz...");
      // remove token from URL to avoid leakage
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState({}, document.title, url.toString());

      // short delay so users can see message
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } else if (error) {
      setMessage(`Giriş sırasında hata: ${error}`);
    } else {
      setMessage("Giriş bilgisi bulunamadı.");
    }
  }, []);

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack />
        <h1>Giriş</h1>
      </header>

      <main style={{ padding: 20 }}>
        <p>{message}</p>
        <p>
          Eğer otomatik yönlendirme olmazsa <a href="/">anasayfaya dönün</a>.
        </p>
      </main>
    </TeamShell>
  );
}
