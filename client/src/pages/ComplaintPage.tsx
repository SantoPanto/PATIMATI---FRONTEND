import { ShieldOff } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";

export default function ComplaintPage() {
  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/profile" />
        <h1>Şikayet Sistemi</h1>
      </header>

      <div className="hero-card">
        <div>
          <p className="eyebrow">Güvenli deneyim</p>
          <h2>Henüz şikayetiniz yok</h2>
          <p>
            İlan, mesaj ya da kullanıcı davranışıyla ilgili şikayetlerinizi
            ilgili ilan veya kullanıcı sayfasındaki "Şikayet Et" butonundan
            iletebilirsiniz.
          </p>
        </div>
      </div>

      <section className="card-stack">
        <article className="content-card">
          <div className="content-card__top">
            <ShieldOff size={18} />
          </div>
          <h3>Kayıtlı şikayet bulunamadı</h3>
          <p>Oluşturduğunuz şikayetler burada listelenecek.</p>
        </article>
      </section>
    </TeamShell>
  );
}
