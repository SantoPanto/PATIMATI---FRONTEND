import { Heart, MessageCircle, PawPrint, Share2 } from "lucide-react";
import { TeamBack, TeamShell } from "../components/TeamUI";

export default function PetDetailPage() {
  return <TeamShell className="detail-page"><section className="detail-image"><div><TeamBack href="/listings" /><span><button className="icon-button" aria-label="Favori"><Heart size={24} /></button><button className="icon-button" aria-label="Paylaş"><Share2 size={22} /></button></span></div></section><article className="detail-card"><PawPrint size={46} color="#ed850c" /><h1>İlan Detayı</h1><p className="breed">İlan bilgileri API üzerinden yüklenecek.</p><section className="info"><p><MessageCircle /> Hayvan, konum ve iletişim bilgileri bu alanda gösterilecek.</p></section></article></TeamShell>;
}
