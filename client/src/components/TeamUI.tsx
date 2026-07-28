import type { ReactNode } from "react";
import { CirclePlus, House, MapPinned, MessageCircle, PawPrint, UserRound } from "lucide-react";
import { Link, useLocation } from "wouter";

export function TeamButton({ children, variant = "primary", full = false, type = "button", onClick }: { children: ReactNode; variant?: "primary" | "outline" | "quiet"; full?: boolean; type?: "button" | "submit"; onClick?: () => void }) {
  return <button type={type} onClick={onClick} className={`button button--${variant}${full ? " button--full" : ""}`}>{children}</button>;
}

function Nav() {
  const [location] = useLocation();
  const item = (href: string, label: string, icon: ReactNode, add = false) => <Link href={href} className={`nav-item${location === href ? " is-active" : ""}${add ? " nav-item--add" : ""}`}><span className="nav-item__icon">{icon}</span><small>{label}</small></Link>;
  return <nav className="bottom-nav">{item("/", "Ana Sayfa", <House size={25} />)}{item("/map", "Harita", <MapPinned size={25} />)}{item("/add-listing", "Ekle", <CirclePlus size={30} />, true)}{item("/chat", "Sohbet", <MessageCircle size={25} />)}{item("/profile", "Profil", <UserRound size={25} />)}</nav>;
}

export function TeamShell({ children, className = "", nav = true }: { children: ReactNode; className?: string; nav?: boolean }) {
  return <div className="app-shell"><main className={className}>{children}</main>{nav ? <Nav /> : null}</div>;
}
export function TeamBack({ href = "/" }: { href?: string }) { return <Link href={href} className="icon-button" aria-label="Geri">←</Link>; }
export function TeamLogo() { return <div className="logo"><span><PawPrint size={24} /></span><strong>Pattymaty</strong></div>; }
