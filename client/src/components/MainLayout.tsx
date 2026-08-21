import React from "react";
import Header from "./Header";
import Footer from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  className?: string;
}

/**
 * MainLayout - Merkezi Sayfa Düzeni Bileşeni (SRP & DRY)
 * Tüm sayfalar için ortak sticky Header, esnek içerik alanı ve isteğe bağlı Footer sağlar.
 */
export default function MainLayout({
  children,
  showFooter = true,
  className = "",
}: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Header />
      <main className={`flex-1 ${className}`}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
