import { Eye } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { petListings } from "../data/mockData";

export default function AdminListingsPage() {
  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/admin" />
        <h1>İlan Yönetimi</h1>
      </header>

      <section className="card-stack">
        {petListings.map((item) => (
          <article key={item.id} className="content-card">
            <div className="content-card__top">
              <div className="pill">{item.type}</div>
              <span className="muted">{item.status}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.location}</p>
            <div className="content-card__footer">
              <span>{item.species}</span>
              <button className="text-link" type="button">
                <Eye size={16} />
                İncele
              </button>
            </div>
          </article>
        ))}
      </section>
    </TeamShell>
  );
}
