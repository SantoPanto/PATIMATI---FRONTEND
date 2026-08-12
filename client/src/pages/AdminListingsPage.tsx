import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { getAdminAds } from "../services/admin";
import type { AdResponse } from "../services/types";

export default function AdminListingsPage() {
  const [listings, setListings] = useState<AdResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getAdminAds({ page: 0, size: 50 })
      .then((response) => {
        if (!cancelled) {
          setListings(response.content);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "İlanlar yüklenemedi.",
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
        <h1>İlan Yönetimi</h1>
      </header>

      <section className="card-stack">
        {loading && <p className="muted">İlanlar yükleniyor...</p>}

        {error && <p className="muted">{error}</p>}

        {!loading && !error && listings.length === 0 && (
          <p className="muted">İlan bulunamadı.</p>
        )}

        {listings.map((item) => (
          <article key={item.id} className="content-card">
            <div className="content-card__top">
              <div className="pill">{item.adType}</div>
              <span className="muted">
                {item.active ? "Active" : "Inactive"}
              </span>
            </div>

            <h3>{item.title}</h3>

            <p>
              {item.latitude}, {item.longitude}
            </p>

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
