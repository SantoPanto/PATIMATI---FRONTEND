import { CheckCheck } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { notifications } from "../data/mockData";

export default function NotificationsPage() {
  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/profile" />
        <h1>Bildirimler</h1>
      </header>

      <section className="card-stack">
        {notifications.map((item) => (
          <article key={item.id} className="content-card">
            <div className="content-card__top">
              <div className={`pill ${item.unread ? "pill--warning" : ""}`}>{item.unread ? "Yeni" : "Okundu"}</div>
              <span className="muted">{item.time}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.message}</p>
            <button className="button button--quiet" type="button">
              <CheckCheck size={16} />
              İşaretle
            </button>
          </article>
        ))}
      </section>
    </TeamShell>
  );
}
