import { Link } from "wouter";
import { PawPrint } from "lucide-react";
import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="pm-footer">
      <div className="pm-container pm-footer__inner">
        <div className="pm-footer__brand">
          <Link href="/" className="pm-footer__logo" aria-label="PATIMATI ana sayfa">
            <span><PawPrint size={23} /></span>
            <strong>PATI<em>MATI</em></strong>
          </Link>

          <p>
            Kayıp bulunan ve sahiplendirilecek hayvanları doğru kişilere ulaştıran topluluk platformu
          </p>
        </div>

        <nav className="pm-footer__links" aria-label="Alt menü">
          <Link href="/listings">İlanlar</Link>
          <Link href="/map">Harita</Link>
          <Link href="/safety">Güvenlik</Link>
          <Link href="/about">Hakkımızda</Link>
        </nav>
      </div>

      <div className="pm-container pm-footer__bottom">
        <span>© 2026 PATIMATI Tüm hakları saklıdır</span>
        <span>Minik dostlarımız için birlikte</span>
      </div>
    </footer>
  );
}