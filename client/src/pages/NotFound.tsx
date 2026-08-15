import { Compass } from "lucide-react";
import { Link } from "wouter";
import { TeamButton, TeamShell } from "../components/TeamUI";

export default function NotFound() {
  return (
    <TeamShell nav={false} className="empty">
      <Compass size={50} />
      <h1>Sayfa Bulunamadı</h1>
      <p>Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.</p>
      <Link href="/">
        <TeamButton>Ana Sayfaya Dön</TeamButton>
      </Link>
    </TeamShell>
  );
}
