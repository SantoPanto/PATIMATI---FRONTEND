import { useEffect, useState } from "react";
import { Activity, AlertTriangle, LayoutGrid, Users } from "lucide-react";
import { Link } from "wouter";
import { TeamBack, TeamShell } from "../components/TeamUI";
import {
  getAdminAdComplaints,
  getAdminAds,
  getAdminUserComplaints,
  getAdminUsers,
} from "../services/admin";

export default function AdminDashboardPage() {
  const [usersCount, setUsersCount] = useState(0);
  const [listingsCount, setListingsCount] = useState(0);
  const [complaintsCount, setComplaintsCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getAdminUsers({ page: 0, size: 1 }),
      getAdminAds({ page: 0, size: 1 }),
      getAdminAdComplaints({ page: 0, size: 1 }),
      getAdminUserComplaints({ page: 0, size: 1 }),
    ])
      .then(([users, ads, adComplaints, userComplaints]) => {
        if (cancelled) return;

        setUsersCount(users.totalElements);
        setListingsCount(ads.totalElements);
        setComplaintsCount(
          adComplaints.totalElements + userComplaints.totalElements,
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Admin verileri yüklenemedi.",
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
        <TeamBack href="/profile" />
        <h1>Admin Panel</h1>
      </header>

      {error && <p className="muted">{error}</p>}

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon">
            <LayoutGrid size={18} />
          </div>

          <div>
            <strong>{loading ? "..." : listingsCount}</strong>
            <p>Toplam ilan</p>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <AlertTriangle size={18} />
          </div>

          <div>
            <strong>{loading ? "..." : complaintsCount}</strong>
            <p>Şikayet</p>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <Users size={18} />
          </div>

          <div>
            <strong>{loading ? "..." : usersCount}</strong>
            <p>Kullanıcı</p>
          </div>
        </article>
      </section>

      <section className="card-stack">
        <h2 className="section-heading">Yönetim alanları</h2>

        <div className="dashboard-grid">
          <Link
            href="/admin/complaints"
            className="content-card dashboard-link"
          >
            <Activity size={20} />
            <span>Şikayetleri yönet</span>
          </Link>

          <Link
            href="/admin/users"
            className="content-card dashboard-link"
          >
            <Users size={20} />
            <span>Kullanıcıları yönet</span>
          </Link>

          <Link
            href="/admin/listings"
            className="content-card dashboard-link"
          >
            <LayoutGrid size={20} />
            <span>İlanları yönet</span>
          </Link>
        </div>
      </section>
    </TeamShell>
  );
}