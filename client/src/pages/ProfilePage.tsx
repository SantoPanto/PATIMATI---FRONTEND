import { AlertTriangle, BellRing, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "wouter";
import { TeamBack, TeamShell } from "../components/TeamUI";

export default function ProfilePage() {
  return (
    <TeamShell className="screen">
      <header className="center-header">
        <TeamBack href="/" />
        <h1>Profil</h1>
      </header>

      <section className="profile">
        <span><UserRound size={38} /></span>
        <h2>Elif Yılmaz</h2>
        <p>evcilhayvan.sever@example.com</p>
        <div>
          <b>12<small>İlan</small></b>
          <b>4<small>Mesaj</small></b>
          <b>2<small>Bildirim</small></b>
        </div>
      </section>

      <section className="card-stack">
        <div className="dashboard-grid">
          <Link href="/notifications" className="content-card dashboard-link">
            <BellRing size={18} />
            <span>Bildirimler</span>
          </Link>
          <Link href="/complaints" className="content-card dashboard-link">
            <AlertTriangle size={18} />
            <span>Şikayet sistemi</span>
          </Link>
          <Link href="/admin" className="content-card dashboard-link">
            <ShieldCheck size={18} />
            <span>Yönetim paneli</span>
          </Link>
        </div>
      </section>
    </TeamShell>
  );
}
