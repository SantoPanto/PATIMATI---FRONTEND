import { Inbox, Search } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";

export default function ListingsPage() {
  return <TeamShell className="screen"><header className="center-header"><TeamBack /><h1>İlanlar</h1></header><label className="search"><Search size={24} /><input placeholder="İlanlarda ara..." /></label><section className="empty"><Inbox size={46} /><h2>Henüz ilan yok</h2><p>İlanlar backend bağlantısından sonra burada listelenecek.</p></section></TeamShell>;
}
