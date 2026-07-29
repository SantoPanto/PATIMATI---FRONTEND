import { useEffect, useState } from "react";
import { TeamShell } from "../components/TeamUI";
import PetCard from "../components/PetCard";
import { getListings } from "../services/api";

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await getListings();
        if (mounted && Array.isArray(data)) setListings(data as any[]);
      } catch (err: any) {
        setError(err?.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <h1>İlanlar</h1>
      </header>

      {loading ? (
        <div className="page-container">Yükleniyor...</div>
      ) : error ? (
        <div className="page-container">Hata: {error}</div>
      ) : listings.length === 0 ? (
        <section className="empty page-container">
          <h2>Henüz ilan yok</h2>
          <p>İlanlar backend bağlantısından sonra burada listelenecek.</p>
        </section>
      ) : (
        <section className="listings page-container">
          {listings.map((item: any) => (
            <PetCard key={item.id} pet={item} />
          ))}
        </section>
      )}
    </TeamShell>
  );
}
