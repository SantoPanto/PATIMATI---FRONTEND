import { UserRoundCog } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { users } from "../data/mockData";

export default function AdminUsersPage() {
  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/admin" />
        <h1>Kullanıcı Yönetimi</h1>
      </header>

      <section className="card-stack">
        {users.map((user) => (
          <article key={user.id} className="content-card">
            <div className="content-card__top">
              <div className="pill">{user.role}</div>
              <span className="muted">{user.status}</span>
            </div>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <p className="muted">Katılma: {user.joinedAt}</p>
            <button className="button button--quiet" type="button">
              <UserRoundCog size={16} />
              Rolü güncelle
            </button>
          </article>
        ))}
      </section>
    </TeamShell>
  );
}
