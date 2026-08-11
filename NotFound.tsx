import { PawPrint } from "lucide-react";
import { Link } from "wouter";
import { TeamButton, TeamShell } from "../components/TeamUI";

export default function NotFound() {
  return <TeamShell nav={false} className="empty">
    <PawPrint size={50} />
    <h1>Bu sayfayı bulamadık.</h1>
    <p>Aradığınız sayfa taşınmış olabilir.</p>
    <Link href="/"><TeamButton>Ana Sayfaya Dön</TeamButton></Link>
  </TeamShell>;
}
