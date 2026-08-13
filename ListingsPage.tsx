import React from "react";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { TeamBack, TeamShell } from "../components/TeamUI";
import { petListings } from "../data/mockData";

export default function MapPage(): JSX.Element {
  const [lost, setLost] = useState(true);
  const [found, setFound] = useState(true);

  const visibleListings = (petListings ?? []).filter((item) => {
    if (item?.type === "Kayıp" && !lost) return false;
    if (item?.type === "Bulunan" && !found) return false;
    return true;
  });

  return (
    <TeamShell className="map-page">
      <header className="center-header">
        <TeamBack href="/" />
        <h1>Harita</h1>
        <button className="icon-button" aria-label="Filtre">☰</button>
      </header>

      <section className="map-filter">
        <label>
          <MapPin size={16} /> Kayıp Hayvanlar
          <button
            type="button"
            className={toggle lost ${lost ? "on" : ""}}
            onClick={() => setLost((s) => !s)}
            aria-pressed={lost}
            aria-label={lost ? "Kayıp hayvanları gizle" : "Kayıp hayvanları göster"}
          />
        </label>
        <label>
          <MapPin size={16} /> Bulunan Hayvanlar
          <button
            type="button"
            className={toggle found ${found ? "on" : ""}}
            onClick={() => setFound((s) => !s)}
            aria-pressed={found}
            aria-label={found ? "Bulunan hayvanları gizle" : "Bulunan hayvanları göster"}
          />
        </label>
      </section>

      <section className="map-art">
        <strong>Patimati Haritası</strong>
        {visibleListings.map((item, index) => (
          <div
            key={item.id ?? index}
            className={map-marker ${index % 2 === 0 ? "marker-one" : "marker-two"}}
          >
            <MapPin size={18} />
            <span>{item.location}</span>
          </div>
        ))}
      </section>
    </TeamShell>
  );
}
Pasted text(7).txt
Document
Pasted text(8).txt
Document
do you think it will work why are they under a file alone
PatiMati-Durum-ve-Yapilacak-Isler.pdf
PDF
this is what he sent us u may find answers in it 
Called tool

Yes — I checked the PDF carefully, especially the notification / FCM-related sections, and it actually gives us an important answer.

What the PDF tells us

The document explicitly says that notifications are not implemented on the backend yet.

In the main status table, it says:

Bildirimler YOK (adres de tablo da) — Önce backend — D5

Meaning: Notifications don't exist yet; there is neither an endpoint nor a database table.

Then D5 explains exactly what the backend team needs to build:

a notification storage/table
an API endpoint
connect the existing NotificationsPage
connect the notification bell in Header.tsx

And this explains your FCM token problem

The PDF's B5 says the backend's AiMatchNotifier currently checks for the user's notification token.

If the user has no token, it simply returns without sending anything.

The measurement found:

13 notification attempts → 0 actually delivered → 0 warnings

So your backend teammate already has the concept of fcmToken — that's why we found:

recipient.getFcmToken()

and:

user.setFcmToken(...)

But the PDF does not specify an endpoint that the frontend should call to register/update the FCM token.

That's the missing piece.

So I would NOT ask him "do you have notifications?"

He clearly does have the FCM sending infrastructure.

The actual question is:

How does a normal logged-in frontend user register/update their FCM token?

Because your current frontend has:

getFcmToken()

but we need somewhere to send the result.

For example, we need something conceptually like:

Frontend
   ↓
getFcmToken()
   ↓
"abc123..."
   ↓
PUT/POST /api/auth/?????
   ↓
User.fcmToken
   ↓
AiMatchNotifier
   ↓
Firebase
   ↓
Phone notification

The PDF confirms the last part exists, but it does not tell us the PUT/POST /api/... endpoint for the first part.

One more important thing I found

The PDF also says that D5 cannot be completed purely on the frontend because the backend needs to create the notification storage/API first.

So if you were planning to build the whole Notifications page right now, don't start inventing API calls.

We should first get the backend contract.

Send him this

I checked the PatiMati status document. I see B5 says AiMatchNotifier uses the user's FCM token, and D5 says notifications still need a backend table + endpoint. On our frontend we already have getFcmToken() in firbase.ts. What endpoint/body should frontend use to register/update this FCM token for a normal logged-in user? I couldn't find that endpoint in the document or UserController.

That's the precise question now.

And importantly: you didn't miss an answer in the PDF. I checked the relevant sections; the PDF tells us that notifications/token delivery are incomplete, but it does not provide a frontend FCM-token registration endpoint.

Pasted text(9).txt
Document
Pasted text(10).txt
Document
Patimati-FrontEnd Düzeltme Raporu (1)(1).pdf
PDF
we need to fix 1 4 6 7
Pasted text(20260813-073603).txt
Document
PS C:\Users\lamma\Desktop\PATIMATI---FRONTEND\client> Get-Content .\src\pages\HomePage.tsx | Select-Object -Skip 900 -First 350
                <span className="text-xl font-bold text-[#0F172A]">
                  PATI
                  <span className="text-[#F97316]">MATI</span>
                </span>
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-6 text-[#64748B]">
                KayÄ±p, bulunan ve sahiplendirilecek hayvanlarÄ±
                gÃ¼venli iletiÅŸim ile doÄŸru kiÅŸilere ulaÅŸtÄ±ran
                topluluk platformu.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">
                KeÅŸfet
              </h3>

              <nav
                className="mt-4 flex flex-col gap-3"
                aria-label="Footer keÅŸfet"
              >
                <Link
                  href="/listings"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  Ä°lanlar
                </Link>

                <Link
                  href="/map"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  Harita
                </Link>

                <Link
                  href="/adoption"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  Sahiplendirme
                </Link>
              </nav>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">
                PATIMATI
              </h3>

              <nav
                className="mt-4 flex flex-col gap-3"
                aria-label="Footer kurumsal"
              >
                <Link
                  href="/safety"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  GÃ¼venlik
                </Link>

                <Link
                  href="/about"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  HakkÄ±mÄ±zda
                </Link>

                <Link
                  href="/contact"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  Ä°letiÅŸim
                </Link>
              </nav>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Yasal
              </h3>

              <nav
                className="mt-4 flex flex-col gap-3"
                aria-label="Footer yasal"
              >
                <Link
                  href="/privacy"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  Gizlilik
                </Link>

                <Link
                  href="/terms"
                  className="text-sm text-[#64748B] transition hover:text-[#F97316]"
                >
                  KullanÄ±m KoÅŸullarÄ±
                </Link>
              </nav>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-[#E2E8F0] pt-6 text-sm text-[#94A3B8] sm:flex-row sm:items-center sm:justify-between">
            <p>Â© 2026 PATIMATI. TÃ¼m haklarÄ± saklÄ±dÄ±r.</p>
            <p>Minik dostlarÄ±mÄ±z iÃ§in birlikte.</p>
          </div>
        </div>
      </footer>

      <div
        className={filter-drawer-overlay ${
          isFilterOpen ? "is-open" : ""
        }}
        aria-hidden={!isFilterOpen}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setIsFilterOpen(false);
          }
        }}
      >
        <aside
          className="filter-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Ä°lan filtreleri"
        >
          <div className="filter-drawer__header">
            <div>
              <span>Arama seÃ§enekleri</span>
              <h2>Filtreler</h2>
            </div>

            <button
              type="button"
              className="filter-drawer__close"
              aria-label="Filtre panelini kapat"
              onClick={() => setIsFilterOpen(false)}
            >
              <X size={22} />
            </button>
          </div>

          <div className="filter-drawer__body">
            <section className="filter-group">
              <div className="filter-group__heading">
                <h3>Mesafe</h3>
                <strong>{maxDistance} km</strong>
              </div>

              <input
                className="filter-range"
                type="range"
                min="1"
                max="25"
                value={maxDistance}
                onChange={(event) =>
                  setMaxDistance(Number(event.target.value))
                }
              />

              <div className="filter-range__labels">
                <span>1 km</span>
                <span>25 km</span>
              </div>
            </section>

            <section className="filter-group">
              <h3>Hayvan tÃ¼rÃ¼</h3>

              <div className="filter-chip-grid">
                {["Kedi", "KÃ¶pek", "KuÅŸ", "DiÄŸer"].map(
                  (animal) => (
                    <button
                      key={animal}
                      type="button"
                      className={
                        selectedAnimals.includes(animal)
                          ? "is-selected"
                          : ""
                      }
                      onClick={() =>
                        toggleAnimalFilter(animal)
                      }
                    >
                      {animal}
                    </button>
                  ),
                )}
              </div>
            </section>

            <section className="filter-group">
              <h3>Ä°lan tÃ¼rÃ¼</h3>

              <div className="filter-checkbox-list">
                {(
                  [
                    ["lost", "KayÄ±p"],
                    ["found", "Bulunan"],
                    ["adoption", "Sahiplendirme"],
                  ] as const
                ).map(([type, label]) => (
                  <label key={type}>
                    <input
                      type="checkbox"
                      checked={selectedListingTypes.includes(type)}
                      onChange={() =>
                        toggleListingTypeFilter(type)
                      }
                    />

                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="filter-group">
              <label className="filter-switch-row">
                <div>
                  <strong>Sadece Ã¶ne Ã§Ä±kanlar</strong>
                  <span>Ã–ne Ã§Ä±karÄ±lmÄ±ÅŸ ilanlarÄ± gÃ¶ster</span>
                </div>

                <input
                  type="checkbox"
                  checked={onlyFeatured}
                  onChange={(event) =>
                    setOnlyFeatured(event.target.checked)
                  }
                />
              </label>
            </section>
          </div>

          <div className="filter-drawer__footer">
            <button
              type="button"
              className="filter-clear-button"
              onClick={clearAdvancedFilters}
            >
              Temizle
            </button>

            <button
              type="button"
              className="filter-apply-button"
              onClick={() => setIsFilterOpen(false)}
            >
              {filteredListings.length} sonucu gÃ¶ster
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
PS C:\Users\lamma\Desktop\PATIMATI---FRONTEND\client>

Yes — looking at this actual App.tsx, I can confirm it is primarily a routing/access-control layer, not the page UI.

Your App.tsx is actually quite well structured.

What this file is doing

It has four main responsibilities:

1. Importing the pages

import HomePage from "./pages/HomePage";
import ListingsPage from "./pages/ListingsPage";
import MapPage from "./pages/MapPage";
...

This doesn't create their UI. It makes those page components available to the router.

2. Defining the routes

For example:

<Route path="/" component={HomePage} />
<Route path="/listings" component={ListingsPage} />
<Route path="/map" component={MapPage} />
<Route path="/pet/:id" component={PetDetailPage} />

So:

/             → HomePage
/listings     → ListingsPage
/map          → MapPage
/pet/:id      → PetDetailPage

3. Protecting private pages

For example:

function ProtectedChatDetailPage() {
  return <RequireAuth component={ChatDetailPage} fallbackPath="/adoption" />;
}

Then:

<Route
  path="/chat/:userId"
  component={ProtectedChatDetailPage}
/>

So ChatDetailPage itself doesn't have to implement the authentication redirect.

4. Providing the global error boundary

<ErrorBoundary title="Uygulama yüklenirken bir sorun oluştu.">
  <Switch>
    ...
  </Switch>
</ErrorBoundary>
And your /listings route is correct

You currently have:

<Route path="/listings" component={ListingsPage} />

That's exactly what we need.

It's also not protected, which makes sense because your backend has:

GET /api/public/ads

So guests can browse listings.

Important: I see something useful regarding our WebSocket problem

Your current route is:

<Route path="/chat/:userId" component={ProtectedChatDetailPage} />

and:

function ProtectedChatDetailPage() {
  return <RequireAuth component={ChatDetailPage} fallbackPath="/adoption" />;
}

That means ChatDetailPage is only actually needed when the user visits /chat/:userId.

This strengthens the case for lazy-loading the WebSocket dependency rather than removing WebSocket.

But notice something important:

App.tsx itself imports ChatDetailPage at the top:

import ChatDetailPage from "./pages/ChatDetailPage";

So even though the route is protected, the module can still enter the initial bundle.

That's why simply having the route protected doesn't prevent the SockJS dependency from being loaded.

Therefore

We should eventually change the architecture from:

App.tsx
 ↓
ChatDetailPage imported immediately
 ↓
websocket.ts
 ↓
SockJS
 ↓
browser-crypto.js
 ↓
global ❌

to something where the WebSocket dependency is only loaded when chat is actually opened.

But I agree with your concern about changing things repeatedly. We should not touch it yet.

Your App.tsx is not the reason your Listings UI is missing. The /listings route is correct.

The current situation is:

App.tsx                 ✅ route is correct
ListingsPage.tsx       ✅ now implemented
ads.ts                 ✅ correct API function exists
types.ts               ✅ correct data types
Backend                 ✅ public ads endpoint exists
HomePage UI             ✅ existing design
SockJS                  ❌ global is not defined

So the next fix should specifically target the SockJS import chain, without changing your routing or page UI.

Pasted text(20260813-075453).txt
Document
this app css this is respo for design we didn't touch it right *

Yes. App.css is responsible for the visual design/styling, while App.tsx is mainly routing and page composition.

And based on the App.css you just sent, we should not touch it just to make ListingsPage.tsx functional.

It already contains a substantial amount of the PATIMATI design system, including:

global colors, typography, spacing, etc.
shared .page-container, header, buttons, navigation styles
the existing listing-card design (.pet-listing-card, image, status, favorite button, body, etc.)
listing filters and responsive behavior
mobile layouts and bottom navigation
the newer shared Header V2 styles later in the file.
So our approach should be
App.tsx
   ↓
/listings
   ↓
ListingsPage.tsx
   ↓
getPublicAds()
   ↓
Backend /api/public/ads
   ↓
real AdResponse data
   ↓
existing PATIMATI CSS classes

We don't redesign the CSS.

We build ListingsPage.tsx to use the existing classes/design language, while making the page actually work with your backend:

real listings from /api/public/ads
LOST / FOUND / ADOPTION filters
search
pagination
real photos from photoUrls
real title/species/breed/location data
favorite behavior according to the existing auth system
clicking a card → /pet/:id
loading state
error state
empty state
responsive layout

One thing I noticed already: the CSS has listing styles designed primarily around the HomePage listing section, so before writing the page I would inspect the rest of App.css for any existing listing-page-specific classes rather than inventing duplicates.

So yes: leave App.tsx and App.css alone for now. We should make ListingsPage.tsx fit the design that already exists.

ok do it it sould follow that design 
Called tool

Done. I built ListingsPage.tsx around the existing PATIMATI UI/design and your actual backend API, without modifying App.tsx or App.css.

Download the completed ListingsPage.tsx

It uses your existing:

Header
getPublicAds()
AdResponse
/api/public/ads
LOST / FOUND / ADOPTION
existing .pet-listing-card design
existing filter drawer design
responsive/mobile CSS
/pet/:id routing
real backend photos
backend pagination
search within the loaded results
loading/error/empty states
Put it here

Replace:

src/pages/ListingsPage.tsx

with the downloaded file.

Then run:

npm run dev

and open:

http://localhost:3000/listings

Important: I deliberately did not add fake backend fields such as featured, distance, or a nonexistent search endpoint. Your backend's public ads controller only exposes adType, page, and size, so the page sticks to what the backend actually supports.

After you replace it, run the app and send me the browser console output + what /listings looks like. Then we can fix any integration issue rather than changing the architecture again. 

ListingsPage.tsx
Code

Library
/
ListingsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  PawPrint,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import Header from "../components/Header";
import { getPublicAds } from "../services/ads";
import type { AdResponse, AdType } from "../services/types";

type FilterType = "ALL" | AdType;
type SpeciesFilter = "ALL" | "CAT" | "DOG";

const PAGE_SIZE = 20;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=900&q=85";

const adTypeLabels: Record<AdType, string> = {
  LOST: "Kayıp",
  FOUND: "Bulunan",
  ADOPTION: "Sahiplendirme",
};

const speciesLabels: Record<string, string> = {
  CAT: "Kedi",
  DOG: "Köpek",
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getSpeciesLabel(species: string) {
  return speciesLabels[species] ?? species;
}

function getAdTypeClass(adType: AdType) {
  return adType.toLowerCase();
}

export default function ListingsPage() {
  const [, navigate] = useLocation();

  const [ads, setAds] = useState<AdResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [activeType, setActiveType] = useState<FilterType>("ALL");
  const [species, setSpecies] = useState<SpeciesFilter>("ALL");
  const [search, setSearch] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAds() {
      setLoading(true);
      setError(null);

      try {
        const response = await getPublicAds({
          page,
          size: PAGE_SIZE,
          adType: activeType === "ALL" ? undefined : activeType,
        });

        if (cancelled) return;

        setAds(response.content ?? []);
        setTotalPages(response.totalPages ?? 0);
      } catch (err) {
        if (cancelled) return;

        console.error("İlanlar yüklenemedi:", err);
        setError(
          err instanceof Error
            ? err.message
            : "İlanlar yüklenirken bir hata oluştu.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAds();

    return () => {
      cancelled = true;
    };
  }, [page, activeType]);

  useEffect(() => {
    document.body.style.overflow = isFilterOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isFilterOpen]);

  const filteredAds = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("tr-TR");

    return ads.filter((ad) => {
      const matchesSpecies =
        species === "ALL" || ad.species === species;

      if (!normalized) {
        return matchesSpecies;
      }

      const searchableText = [
        ad.title,
        ad.description,
        ad.breed,
        ad.ownerDisplayName,
        getSpeciesLabel(ad.species),
        adTypeLabels[ad.adType],
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return matchesSpecies && searchableText.includes(normalized);
    });
  }, [ads, search, species]);

  function handleTypeChange(type: FilterType) {
    setActiveType(type);
    setPage(0);
  }

  function clearFilters() {
    setSpecies("ALL");
    setSearch("");
    setActiveType("ALL");
    setPage(0);
  }

  function toggleFavorite(id: number) {
    setFavoriteIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <div className="home-page">
      <Header />

      <main>
        <section className="listings-section" style={{ minHeight: "calc(100vh - 76px)" }}>
          <div className="page-container">
            <div className="section-heading-row">
              <div className="section-heading">
                <span className="section-eyebrow">PATIMATI</span>
                <h1>İlanlar</h1>
                <p>
                  Kayıp, bulunan ve sahiplendirilecek hayvan ilanlarını
                  keşfet.
                </p>
              </div>

              <button
                type="button"
                className="hero-secondary-action"
                onClick={() => setIsFilterOpen(true)}
                aria-label="İlan filtrelerini aç"
                style={{ cursor: "pointer" }}
              >
                <SlidersHorizontal size={18} />
                Filtrele
              </button>
            </div>

            <div
              className="listing-filters"
              aria-label="İlan türü filtresi"
            >
              {(
                [
                  ["ALL", "Tümü"],
                  ["LOST", "Kayıp"],
                  ["FOUND", "Bulunan"],
                  ["ADOPTION", "Sahiplendirme"],
                ] as const
              ).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  className={activeType === type ? "active" : ""}
                  onClick={() => handleTypeChange(type)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              className="hero-search"
              style={{ maxWidth: "100%", marginTop: 22 }}
            >
              <Search size={20} aria-hidden="true" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="İlan, tür, ırk veya kullanıcı ara..."
                aria-label="İlanlarda ara"
              />

              {search && (
                <button
                  type="button"
                  aria-label="Aramayı temizle"
                  onClick={() => setSearch("")}
                  style={{
                    width: 42,
                    minHeight: 42,
                    padding: 0,
                    background: "var(--surface-secondary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <X size={17} />
                </button>
              )}
            </div>

            {loading ? (
              <div className="empty-listings">
                <span>
                  <PawPrint size={27} />
                </span>
                <h3>İlanlar yükleniyor...</h3>
                <p>Güncel ilanları getiriyoruz.</p>
              </div>
            ) : error ? (
              <div className="empty-listings">
                <span>
                  <PawPrint size={27} />
                </span>
                <h3>İlanlar yüklenemedi</h3>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setPage(0);
                    setActiveType(activeType);
                  }}
                >
                  Tekrar dene
                </button>
              </div>
            ) : filteredAds.length === 0 ? (
              <div className="empty-listings">
                <span>
                  <Search size={27} />
                </span>
                <h3>İlan bulunamadı</h3>
                <p>
                  Arama veya filtrelerini değiştirerek tekrar deneyebilirsin.
                </p>
                <button type="button" onClick={clearFilters}>
                  Filtreleri temizle
                </button>
              </div>
            ) : (
              <>
                <div className="pet-listings-grid">
                  {filteredAds.map((ad) => {
                    const image = ad.photoUrls?.[0] || FALLBACK_IMAGE;
                    const isFavorite = favoriteIds.includes(ad.id);

                    return (
                      <article className="pet-listing-card" key={ad.id}>
                        <Link
                          href={`/pet/${ad.id}`}
                          className="pet-listing-card__image"
                          aria-label={`${ad.title} detayını aç`}
                        >
                          <img
                            src={image}
                            alt={ad.title}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.src = FALLBACK_IMAGE;
                            }}
                          />

                          <span
                            className={`listing-status listing-status--${getAdTypeClass(
                              ad.adType,
                            )}`}
                          >
                            {adTypeLabels[ad.adType]}
                          </span>
                        </Link>

                        <button
                          type="button"
                          className={`favorite-button ${
                            isFavorite ? "favorite-button--active" : ""
                          }`}
                          aria-label={
                            isFavorite
                              ? "Favorilerden çıkar"
                              : "Favorilere ekle"
                          }
                          aria-pressed={isFavorite}
                          onClick={() => toggleFavorite(ad.id)}
                        >
                          <Heart
                            size={19}
                            fill={isFavorite ? "currentColor" : "none"}
                          />
                        </button>

                        <div className="pet-listing-card__body">
                          <div className="pet-listing-card__title-row">
                            <div>
                              <h3>{ad.title}</h3>
                              <p>
                                {getSpeciesLabel(ad.species)}
                                {ad.breed ? ` • ${ad.breed}` : ""}
                              </p>
                            </div>

                            <span>{formatDate(ad.createdAt)}</span>
                          </div>

                          <div className="pet-listing-card__location">
                            <MapPin size={15} />
                            <span>
                              {ad.latitude.toFixed(4)},{" "}
                              {ad.longitude.toFixed(4)}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="pet-listing-card__button"
                            onClick={() => navigate(`/pet/${ad.id}`)}
                          >
                            İlanı görüntüle
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 30,
                    }}
                  >
                    <button
                      type="button"
                      className="icon-button"
                      disabled={page === 0}
                      onClick={() => setPage((current) => Math.max(0, current - 1))}
                      aria-label="Önceki sayfa"
                    >
                      <ChevronLeft size={19} />
                    </button>

                    <span
                      style={{
                        minWidth: 110,
                        textAlign: "center",
                        color: "var(--text-secondary)",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Sayfa {page + 1} / {totalPages}
                    </span>

                    <button
                      type="button"
                      className="icon-button"
                      disabled={page >= totalPages - 1}
                      onClick={() =>
                        setPage((current) =>
                          Math.min(totalPages - 1, current + 1),
                        )
                      }
                      aria-label="Sonraki sayfa"
                    >
                      <ChevronRight size={19} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <div
        className={`filter-drawer-overlay ${
          isFilterOpen ? "is-open" : ""
        }`}
        aria-hidden={!isFilterOpen}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setIsFilterOpen(false);
          }
        }}
      >
        <aside
          className="filter-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="İlan filtreleri"
        >
          <div className="filter-drawer__header">
            <div>
              <span>Arama seçenekleri</span>
              <h2>Filtreler</h2>
            </div>

            <button
              type="button"
              className="filter-drawer__close"
              aria-label="Filtre panelini kapat"
              onClick={() => setIsFilterOpen(false)}
            >
              <X size={22} />
            </button>
          </div>

          <div className="filter-drawer__body">
            <section className="filter-group">
              <h3>Hayvan türü</h3>

              <div className="filter-chip-grid">
                {(
                  [
                    ["ALL", "Tümü"],
                    ["CAT", "Kedi"],
                    ["DOG", "Köpek"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={species === value ? "is-selected" : ""}
                    onClick={() => setSpecies(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="filter-group">
              <h3>İlan türü</h3>

              <div className="filter-checkbox-list">
                {(
                  [
                    ["LOST", "Kayıp"],
                    ["FOUND", "Bulunan"],
                    ["ADOPTION", "Sahiplendirme"],
                  ] as const
                ).map(([type, label]) => (
                  <label key={type}>
                    <input
                      type="radio"
                      name="ad-type"
                      checked={activeType === type}
                      onChange={() => handleTypeChange(type)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="filter-drawer__footer">
            <button
              type="button"
              className="filter-clear-button"
              onClick={clearFilters}
            >
              Temizle
            </button>

            <button
              type="button"
              className="filter-apply-button"
              onClick={() => setIsFilterOpen(false)}
            >
              Filtreleri uygula
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
