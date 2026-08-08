import { BellRing, CirclePlus, Compass, MessageSquareText, PawPrint, Search } from "lucide-react";
import { Link } from "wouter";
import { TeamLogo, TeamShell } from "../components/TeamUI";
import { petListings } from "../data/mockData";

export default function HomePage() {
  return (
    <TeamShell className="screen">
      <header className="topbar">
        <TeamLogo />
        <Link href="/notifications" className="notification" aria-label="Bildirimler">
          <BellRing size={21} />
          <b>2</b>
        </Link>
      </header>

      <section className="hero-card">
        <p className="eyebrow">Patimati</p>
        <h2>Evcil dostlarını bulmak ve korumak için hazırız.</h2>
        <p>İlanlara göz at, haritada yakınlarını keşfet, gerektiğinde şikayet bildirebilirsin.</p>
      </section>

      <section className="card-stack">
        <div className="section-title">
          <h2><span><PawPrint size={18} /></span> Hızlı işlemler</h2>
        </div>
        <div className="dashboard-grid">
          <Link href="/listings" className="content-card dashboard-link">
            <Search size={18} />
            <span>İlanları keşfet</span>
          </Link>
          <Link href="/map" className="content-card dashboard-link">
            <Compass size={18} />
            <span>Haritada gör</span>
          </Link>
          <Link href="/add-listing" className="content-card dashboard-link">
            <CirclePlus size={18} />
            <span>İlan oluştur</span>
          </Link>
          <Link href="/complaints" className="content-card dashboard-link">
            <MessageSquareText size={18} />
            <span>Şikayet bildir</span>
          </Link>
        </div>
      </section>

      <section className="card-stack">
        <div className="section-title">
          <h2><span><PawPrint size={18} /></span> Son ilanlar</h2>
          <Link href="/listings">Tümünü gör</Link>
        </div>
        <div className="card-stack">
          {petListings.slice(0, 2).map((item) => (
            <article key={item.id} className="content-card">
              <div className="content-card__top">
                <div className="pill">{item.type}</div>
                <span className="muted">{item.distance}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.location}</p>
              <div className="content-card__footer">
                <span>{item.species}</span>
                <Link href={`/pet/${item.id}`} className="text-link">Detay</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </TeamShell>
  );
}
