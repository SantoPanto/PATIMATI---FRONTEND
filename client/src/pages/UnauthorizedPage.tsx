import { ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { TeamButton, TeamShell } from "../components/TeamUI";

export default function UnauthorizedPage() {
  return (
    <TeamShell nav={false} className="empty">
      <ShieldAlert size={50} />
      <h1>Yetkiniz bulunmuyor.</h1>
      <p>Bu sayfaya erişmek için uygun yetkiye sahip olmanız gerekir.</p>
      <Link href="/">
        <TeamButton>Ana Sayfaya Dön</TeamButton>
      </Link>
    </TeamShell>
  );
}
