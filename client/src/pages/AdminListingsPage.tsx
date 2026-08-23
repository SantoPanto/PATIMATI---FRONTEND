import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";
import AdminFilterBar from "../components/admin/AdminFilterBar";
import { getAdminAds } from "../services/admin";
import type { AdResponse } from "../services/types";
import { getUserErrorMessage } from "../utils/errorMessage";

export default function AdminListingsPage() {
  const [listings, setListings] = useState<AdResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("createdAt,desc");
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getAdminAds({
      page,
      size: 50,
      search: searchQuery,
      sort: sortOrder,
    })
      .then((response) => {
        if (!cancelled) {
          setListings(response.content);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            getUserErrorMessage(err, "İlanlar yüklenemedi."),
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
  }, [page, searchQuery, sortOrder]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleSortChange = (sort: string) => {
    setSortOrder(sort);
    setPage(0);
  };

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/admin" />
        <h1>İlan Yönetimi</h1>
      </header>

      <section className="card-stack">
        <AdminFilterBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          placeholder="İlan başlığı veya açıklama ara..."
          className="mb-4"
        />

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
