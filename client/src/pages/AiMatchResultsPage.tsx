import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  PawPrint,
  Search,
  Sparkles,
} from "lucide-react";

import Header from "../components/Header";
import Footer from "../components/Footer";

type MatchResult = {
  id: number;
  name: string;
  animal: string;
  breed: string;
  location: string;
  distance: string;
  similarity: number;
  type: "lost" | "found";
  image: string;
};

import { useEffect, useState } from "react";

export default function AiMatchResultsPage() { const [, navigate] = useLocation(); const [mockResults, setMockResults] = useState<MatchResult[]>([]); useEffect(() => { const stored = sessionStorage.getItem("aiMatchResults"); if (stored) { try { const parsed = JSON.parse(stored); const mapped = parsed.map((item: any) => ({ id: item.ad.id, name: item.ad.title || "İlan", animal: item.ad.species === "CAT" ? "Kedi" : "Köpek", breed: item.ad.breed || "Bilinmiyor", location: (item.ad.district && item.ad.city) ? `${item.ad.district}, ${item.ad.city}` : "Bilinmiyor", distance: "-", similarity: item.score, type: item.ad.listingType === "FOUND" ? "found" : "lost", image: (item.ad.photos && item.ad.photos.length > 0) ? item.ad.photos[0].photoUrl : "https://via.placeholder.com/400" })); setMockResults(mapped); } catch (e) { console.error(e); } } }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
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
                    {mockResults.length}
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
              <h2 className="text-2xl font-bold text-[#0F172A]">
                Eşleşme sonuçları
              </h2>

              <p className="mt-2 text-sm text-[#64748B]">
                Yüksek benzerlik oranına sahip ilanları öncelikli
                incelemeni öneririz.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/ai-match")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#334155] transition hover:border-[#FDBA74] hover:text-[#F97316]"
            >
              <Search size={18} />
              Yeniden ara
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockResults.map((result, index) => (
              <article
                key={result.id}
                className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-64 overflow-hidden bg-[#F1F5F9]">
                  <img
                    src={result.image}
                    alt={result.name}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  />

                  <div className="absolute left-4 top-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white ${
                        result.similarity >= 90
                          ? "bg-[#16A34A]"
                          : result.similarity >= 80
                            ? "bg-[#F97316]"
                            : "bg-[#2563EB]"
                      }`}
                    >
                      <Sparkles size={14} />
                      %{result.similarity} benzer
                    </span>
                  </div>

                  {index === 0 && (
                    <span className="absolute right-4 top-4 rounded-full bg-[#0F172A]/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                      En güçlü eşleşme
                    </span>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#0F172A]">
                        {result.name}
                      </h3>

                      <p className="mt-1 text-sm text-[#64748B]">
                        {result.animal} · {result.breed}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#F97316]">
                      <PawPrint size={22} />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#F8FAFC] px-4 py-3 text-sm text-[#64748B]">
                    <MapPin size={17} className="text-[#F97316]" />

                    <span className="flex-1">{result.location}</span>

                    <strong className="text-[#334155]">
                      {result.distance}
                    </strong>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#64748B]">
                        Görsel benzerlik
                      </span>

                      <span className="text-[#0F172A]">
                        %{result.similarity}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                      <div
                        className="h-full rounded-full bg-[#F97316]"
                        style={{
                          width: `${result.similarity}%`,
                        }}
                      />
                    </div>
                  </div>

                  <Link
                    href={`/pet/${result.id}`}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 py-3.5 font-bold text-white transition hover:bg-[#EA580C]"
                  >
                    İlanı incele
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-5 text-sm leading-6 text-[#475569]">
            <strong className="text-[#1E3A8A]">
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

