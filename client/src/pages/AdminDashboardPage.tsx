import { Activity, AlertTriangle, LayoutGrid, Users } from "lucide-react";
import { Link } from "wouter";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { complaints, petListings, users } from "../data/mockData";

export default function AdminDashboardPage() {
  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/profile" />
        <h1>Admin Panel</h1>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon"><LayoutGrid size={18} /></div>
          <div>
            <strong>{petListings.length}</strong>
            <p>Toplam ilan</p>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon"><AlertTriangle size={18} /></div>
          <div>
            <strong>{complaints.length}</strong>
            <p>Bekleyen şikayet</p>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon"><Users size={18} /></div>
          <div>
            <strong>{users.length}</strong>
            <p>Kullanıcı</p>
          </div>
        </article>
      </section>

      <section className="card-stack">
        <h2 className="section-heading">Yönetim alanları</h2>
        <div className="dashboard-grid">
          <Link href="/admin/complaints" className="content-card dashboard-link">
            <Activity size={20} />
            <span>Şikayetleri yönet</span>
          </Link>
          <Link href="/admin/users" className="content-card dashboard-link">
            <Users size={20} />
            <span>Kullanıcıları yönet</span>
          </Link>
          <Link href="/admin/listings" className="content-card dashboard-link">
            <LayoutGrid size={20} />
            <span>İlanları yönet</span>
          </Link>
        </div>
      </section>
    </TeamShell>
  );
}
