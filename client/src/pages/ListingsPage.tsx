import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { petListings } from "../data/mockData";

export default function ListingsPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return petListings;
    return petListings.filter((item) => `${item.title} ${item.location} ${item.species}`.toLowerCase().includes(search));
  }, [query]);

  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/" />
        <h1>İlanlar</h1>
      </header>

      <label className="search">
        <Search size={24} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="İlanlarda ara..." />
      </label>

      <section className="card-stack">
        {filtered.map((item) => (
          <article key={item.id} className="content-card">
            <div className="content-card__top">
              <div className="pill">{item.type}</div>
              <span className="muted">{item.distance}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="content-card__footer">
              <span>{item.location}</span>
              <Link href={`/pet/${item.id}`} className="text-link">Detay</Link>
            </div>
          </article>
        ))}
      </section>
    </TeamShell>
  );
}
