import { CheckCircle2 } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { complaints } from "../data/mockData";

export default function AdminComplaintsPage() {
  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/admin" />
        <h1>Şikayet Yönetimi</h1>
      </header>

      <section className="card-stack">
        {complaints.map((item) => (
          <article key={item.id} className="content-card">
            <div className="content-card__top">
              <div className="pill pill--warning">{item.status}</div>
              <span className="muted">{item.createdAt}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
            <button className="button button--outline" type="button">
              <CheckCircle2 size={16} />
              Çözüldü olarak işaretle
            </button>
          </article>
        ))}
      </section>
    </TeamShell>
  );
}
