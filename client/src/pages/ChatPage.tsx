import { MessageCircle, MessageCirclePlus, Search } from "lucide-react";
import { useState } from "react";
import { TeamLogo, TeamShell } from "../components/TeamUI";

export default function ChatPage() {
  const [query, setQuery] = useState("");
  return <TeamShell className="screen">
    <header className="topbar"><TeamLogo /><button className="icon-button" aria-label="Yeni sohbet"><MessageCirclePlus size={23} /></button></header>
    <h1 className="big-title">Sohbetler</h1>
    <label className="search"><Search size={24} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sohbet ara..." /></label>
    <section className="empty"><MessageCircle size={48} /><h2>Henüz sohbet yok</h2><p>İlan sahipleriyle yaptığınız konuşmalar burada listelenecek.</p></section>
  </TeamShell>;
}
