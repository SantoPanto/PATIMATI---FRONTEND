import { ArrowRight, MessageSquareWarning } from "lucide-react";
import { useState } from "react";
import ComplaintModal from "../components/ComplaintModal";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { complaints } from "../data/mockData";

export default function ComplaintPage() {
  const [open, setOpen] = useState(false);

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/profile" />
        <h1>Şikayet Sistemi</h1>
      </header>

      <div className="hero-card">
        <div>
          <p className="eyebrow">Güvenli deneyim</p>
          <h2>Bir sorunu hızlıca bildirebilirsiniz.</h2>
          <p>İlan, mesaj ya da kullanıcı davranışıyla ilgili şikayetlerinizi iletebilirsiniz.</p>
        </div>
        <button className="button button--primary" type="button" onClick={() => setOpen(true)}>
          <MessageSquareWarning size={18} />
          Şikayet Oluştur
        </button>
      </div>

      <section className="card-stack">
        {complaints.map((item) => (
          <article key={item.id} className="content-card">
            <div className="content-card__top">
              <div className="pill pill--warning">{item.status}</div>
              <span className="muted">{item.createdAt}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
            <div className="content-card__footer">
              <span>{item.category}</span>
              <button className="text-link" type="button">
                Detay <ArrowRight size={16} />
              </button>
            </div>
          </article>
        ))}
      </section>

      <ComplaintModal open={open} onClose={() => setOpen(false)} />
    </TeamShell>
  );
}
