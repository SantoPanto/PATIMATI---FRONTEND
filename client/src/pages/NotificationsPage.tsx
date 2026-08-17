import { BellOff } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";

export default function NotificationsPage() {
  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/profile" />
        <h1>Bildirimler</h1>
      </header>

      <section className="card-stack">
        <article className="content-card">
          <div className="content-card__top">
            <BellOff size={18} />
          </div>
          <h3>Henüz bildiriminiz yok</h3>
          <p>Yeni bildirimleriniz burada listelenecek.</p>
        </article>
      </section>
    </TeamShell>
  );
}
