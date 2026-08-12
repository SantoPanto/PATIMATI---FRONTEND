import { useEffect, useState } from "react";
import { UserRoundCog } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { getAdminUsers } from "../services/admin";
import type { UserDetailForAdminDTO } from "../services/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDetailForAdminDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getAdminUsers({ page: 0, size: 50 })
      .then((response) => {
        if (!cancelled) {
          setUsers(response.content);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Kullanıcılar yüklenemedi.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/admin" />
        <h1>Kullanıcı Yönetimi</h1>
      </header>

      <section className="card-stack">
        {loading && <p className="muted">Kullanıcılar yükleniyor...</p>}

        {error && <p className="muted">{error}</p>}

        {!loading && !error && users.length === 0 && (
          <p className="muted">Kullanıcı bulunamadı.</p>
        )}

        {users.map((user) => (
          <article key={user.uid} className="content-card">
            <div className="content-card__top">
              <div className="pill">{user.role}</div>
              <span className="muted">
                {user.banned ? "Banned" : user.enabled ? "Active" : "Disabled"}
              </span>
            </div>

            <h3>
              {user.firstName} {user.lastName}
            </h3>

            <p>{user.email}</p>

            {user.createdAt && (
              <p className="muted">
                Katılma: {new Date(user.createdAt).toLocaleDateString("tr-TR")}
              </p>
            )}

            <button className="button button--quiet" type="button" disabled>
              <UserRoundCog size={16} />
              Rolü güncelle
            </button>
          </article>
        ))}
      </section>
    </TeamShell>
  );
}