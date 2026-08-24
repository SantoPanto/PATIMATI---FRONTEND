import { useLocation } from "wouter";
import { ArrowLeft, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import MatchedAdCard from "../components/MatchedAdCard";
import type { MatchedAdResponseDTO } from "../services/types";

export default function AiMatchResultsPage() {
  const [, navigate] = useLocation();
  const [matchResults, setMatchResults] = useState<MatchedAdResponseDTO[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("aiMatchResults");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // sessionStorage'dan (dis sistem) tek seferlik hidrasyon.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setMatchResults(parsed);
        }
      } catch (e) {
        console.error("Eşleştirme sonuçları ayrıştırılamadı:", e);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <main>
        <section className="border-b border-[#E2E8F0] bg-gradient-to-br from-[#FFF7ED] via-white to-[#EFF6FF]">
          <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 md:py-16 lg:px-8">
            <button
              type="button"
              onClick={() => navigate("/ai-match")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#64748B] transition hover:text-[#F97316]"
            >
              <ArrowLeft size={18} />
              Yeni eşleştirme yap
            </button>

            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#FED7AA] bg-white px-4 py-2 text-sm font-bold text-[#F97316]">
                  <Sparkles size={16} />
                  Yapay zekâ eşleştirme sonucu
                </span>

                <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#0F172A] sm:text-5xl">
                  En benzer ilanları bulduk.
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-[#64748B] sm:text-lg">
                  Yüklediğin fotoğraflar mevcut ilanlarla karşılaştırıldı.
                  Sonuçlar görsel benzerlik oranına göre sıralandı.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white px-6 py-5 shadow-sm">
                <span className="text-sm font-medium text-[#64748B]">
                  Bulunan eşleşme
                </span>

                <div className="mt-1 flex items-end gap-2">
                  <strong className="text-3xl font-black text-[#0F172A]">
                    {matchResults.length}
                  </strong>

                  <span className="pb-1 text-sm text-[#94A3B8]">
                    sonuç
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] dark:text-slate-50">
                Eşleşme sonuçları
              </h2>

              <p className="mt-2 text-sm text-[#64748B] dark:text-slate-400">
                Yüksek benzerlik oranına sahip ilanları öncelikli
                incelemeni öneririz.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/ai-match")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#334155] transition hover:border-[#FDBA74] hover:text-[#F97316] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <Search size={18} />
              Yeniden ara
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matchResults.map((match, index) => (
              <MatchedAdCard
                key={match.ad?.id || index}
                match={match}
                variant="grid"
              />
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-5 text-sm leading-6 text-[#475569] dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-slate-300">
            <strong className="text-[#1E3A8A] dark:text-blue-300">
              Eşleşme yüzdesi ne anlama geliyor?
            </strong>

            <p className="mt-2">
              Bu oran fotoğraflardaki renk, desen, yüz yapısı ve benzeri
              görsel özelliklerin benzerliğini gösterir. Kesin kimlik
              doğrulaması değildir; ilan detaylarını inceleyerek doğrulama
              yapmalısın.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
