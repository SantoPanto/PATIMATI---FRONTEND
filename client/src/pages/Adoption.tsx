import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  BadgeCheck,
  CalendarDays,
  Heart,
  MapPin,
  PawPrint,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Syringe,
  UserRound,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/adoption.css";

type AdoptionPet = {
  id: number;
  name: string;
  species: "Kedi" | "Köpek";
  breed: string;
  age: string;
  gender: "Dişi" | "Erkek";
  city: string;
  district: string;
  vaccinated: boolean;
  neutered: boolean;
  description: string;
  image: string;
};

const adoptionPets: AdoptionPet[] = [
  {
    id: 1,
    name: "Maya",
    species: "Kedi",
    breed: "Tekir",
    age: "1 yaşında",
    gender: "Dişi",
    city: "İstanbul",
    district: "Kadıköy",
    vaccinated: true,
    neutered: true,
    description:
      "İnsanlarla arası çok iyi, oyuncu ve tuvalet eğitimli. Sıcak bir yuva arıyor.",
    image:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    name: "Tarçın",
    species: "Köpek",
    breed: "Golden Retriever",
    age: "2 yaşında",
    gender: "Erkek",
    city: "Kocaeli",
    district: "İzmit",
    vaccinated: true,
    neutered: false,
    description:
      "Enerjik, sevecen ve çocuklarla uyumlu. Bahçeli veya hareketli bir aileye uygun.",
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    name: "Luna",
    species: "Kedi",
    breed: "British Shorthair",
    age: "8 aylık",
    gender: "Dişi",
    city: "Bursa",
    district: "Nilüfer",
    vaccinated: true,
    neutered: false,
    description:
      "Sakin, ev ortamına alışkın ve insanlarla iletişimi güçlü bir minik dost.",
    image:
      "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    name: "Poyraz",
    species: "Köpek",
    breed: "Melez",
    age: "3 yaşında",
    gender: "Erkek",
    city: "Ankara",
    district: "Çankaya",
    vaccinated: true,
    neutered: true,
    description:
      "Temel komutları biliyor, tasma ile yürümeye alışkın ve oldukça koruyucu.",
    image:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 5,
    name: "Pamuk",
    species: "Kedi",
    breed: "Van Kedisi",
    age: "2 yaşında",
    gender: "Erkek",
    city: "İzmir",
    district: "Karşıyaka",
    vaccinated: false,
    neutered: false,
    description:
      "Meraklı, hareketli ve oyun oynamayı çok seviyor. Ev ortamına kısa sürede uyum sağlar.",
    image:
      "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 6,
    name: "Boncuk",
    species: "Köpek",
    breed: "Cocker Spaniel",
    age: "1 yaşında",
    gender: "Dişi",
    city: "Eskişehir",
    district: "Tepebaşı",
    vaccinated: true,
    neutered: true,
    description:
      "Sosyal, oyunsever ve diğer hayvanlarla anlaşabilen sevgi dolu bir dost.",
    image:
      "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=900&q=80",
  },
];

export default function Adoption() {
  const [searchTerm, setSearchTerm] = useState("");
  const [species, setSpecies] = useState("Tümü");
  const [city, setCity] = useState("Tümü");
  const [gender, setGender] = useState("Tümü");

  const cities = useMemo(
    () => Array.from(new Set(adoptionPets.map((pet) => pet.city))),
    [],
  );

  const filteredPets = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLocaleLowerCase("tr-TR");

    return adoptionPets.filter((pet) => {
      const matchesSearch =
        !normalizedSearch ||
        pet.name.toLocaleLowerCase("tr-TR").includes(normalizedSearch) ||
        pet.breed.toLocaleLowerCase("tr-TR").includes(normalizedSearch) ||
        pet.city.toLocaleLowerCase("tr-TR").includes(normalizedSearch) ||
        pet.district.toLocaleLowerCase("tr-TR").includes(normalizedSearch);

      const matchesSpecies =
        species === "Tümü" || pet.species === species;

      const matchesCity =
        city === "Tümü" || pet.city === city;

      const matchesGender =
        gender === "Tümü" || pet.gender === gender;

      return (
        matchesSearch &&
        matchesSpecies &&
        matchesCity &&
        matchesGender
      );
    });
  }, [searchTerm, species, city, gender]);

  const resetFilters = () => {
    setSearchTerm("");
    setSpecies("Tümü");
    setCity("Tümü");
    setGender("Tümü");
  };

  return (
    <div className="pm-page adoption-page">
      <Header />

      <main>
        <section className="adoption-hero">
          <div className="pm-container adoption-hero__content">
            <div className="adoption-hero__text">
              <span className="adoption-hero__eyebrow">
                <Sparkles size={17} />
                Yeni bir yuva, yeni bir hayat
              </span>

              <h1>
                Onlara sadece bir ev değil,
                <span> sevgi dolu bir aile ver.</span>
              </h1>

              <p>
                Yuva arayan dostlarımızı incele, sana en uygun
                yol arkadaşını bul ve onun hayatını değiştir.
              </p>

              <div className="adoption-hero__actions">
                <a href="#adoption-list" className="pm-button pm-button--primary">
                  <PawPrint size={19} />
                  Dostları İncele
                </a>

                <Link
                  href="/add-listing?type=adoption"
                  className="pm-button pm-button--secondary"
                >
                  <Plus size={19} />
                  Sahiplendirme İlanı Ver
                </Link>
              </div>

              <div className="adoption-hero__features">
                <span>
                  <ShieldCheck size={18} />
                  Güvenli iletişim
                </span>

                <span>
                  <Heart size={18} />
                  Ücretsiz sahiplendirme
                </span>

                <span>
                  <BadgeCheck size={18} />
                  Detaylı ilan bilgileri
                </span>
              </div>
            </div>

            <div className="adoption-hero__visual" aria-hidden="true">
              <div className="adoption-hero__image">
                <img
                  src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1100&q=85"
                  alt=""
                />
              </div>

              <div className="adoption-hero__floating-card">
                <span className="adoption-hero__floating-icon">
                  <Heart size={22} fill="currentColor" />
                </span>

                <div>
                  <strong>Bir dost seni bekliyor</strong>
                  <span>Sevgi dolu bir yuva için</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="adoption-list"
          className="pm-container adoption-content"
        >
          <div className="adoption-section-heading">
            <div>
              <span className="pm-eyebrow">Sahiplendirme ilanları</span>
              <h2>Yeni dostunla tanış</h2>
              <p>
                Filtreleri kullanarak sana en uygun dostlarımızı
                kolayca bulabilirsin.
              </p>
            </div>

            <Link
              href="/add-listing?type=adoption"
              className="pm-button pm-button--primary adoption-section-heading__button"
            >
              <Plus size={19} />
              İlan Ver
            </Link>
          </div>

          <div className="adoption-filter pm-card">
            <div className="adoption-filter__search">
              <Search size={20} aria-hidden="true" />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="İsim, cins veya konum ara"
                aria-label="Sahiplendirme ilanlarında ara"
              />
            </div>

            <div className="adoption-filter__selects">
              <label>
                <span>Tür</span>
                <select
                  value={species}
                  onChange={(event) => setSpecies(event.target.value)}
                >
                  <option value="Tümü">Tüm türler</option>
                  <option value="Kedi">Kedi</option>
                  <option value="Köpek">Köpek</option>
                </select>
              </label>

              <label>
                <span>Şehir</span>
                <select
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                >
                  <option value="Tümü">Tüm şehirler</option>

                  {cities.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Cinsiyet</span>
                <select
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                >
                  <option value="Tümü">Tümü</option>
                  <option value="Dişi">Dişi</option>
                  <option value="Erkek">Erkek</option>
                </select>
              </label>
            </div>

            <div className="adoption-filter__bottom">
              <span>
                <strong>{filteredPets.length}</strong> ilan bulundu
              </span>

              <button
                type="button"
                className="adoption-filter__clear"
                onClick={resetFilters}
              >
                Filtreleri temizle
              </button>
            </div>
          </div>

          {filteredPets.length > 0 ? (
            <div className="adoption-grid">
              {filteredPets.map((pet) => (
                <article key={pet.id} className="adoption-card pm-card">
                  <div className="adoption-card__image">
                    <img src={pet.image} alt={`${pet.name} isimli ${pet.species}`} />

                    <span className="adoption-card__type">
                      <PawPrint size={15} />
                      {pet.species}
                    </span>

                    <button
                      type="button"
                      className="adoption-card__favorite"
                      aria-label={`${pet.name} ilanını favorilere ekle`}
                    >
                      <Heart size={20} />
                    </button>
                  </div>

                  <div className="adoption-card__content">
                    <div className="adoption-card__header">
                      <div>
                        <h3>{pet.name}</h3>
                        <p>{pet.breed}</p>
                      </div>

                      <span className="adoption-card__gender">
                        <UserRound size={15} />
                        {pet.gender}
                      </span>
                    </div>

                    <div className="adoption-card__meta">
                      <span>
                        <CalendarDays size={17} />
                        {pet.age}
                      </span>

                      <span>
                        <MapPin size={17} />
                        {pet.district}, {pet.city}
                      </span>
                    </div>

                    <p className="adoption-card__description">
                      {pet.description}
                    </p>

                    <div className="adoption-card__health">
                      <span
                        className={
                          pet.vaccinated
                            ? "adoption-health-badge adoption-health-badge--success"
                            : "adoption-health-badge adoption-health-badge--muted"
                        }
                      >
                        <Syringe size={15} />
                        {pet.vaccinated ? "Aşıları tam" : "Aşı bilgisi yok"}
                      </span>

                      {pet.neutered && (
                        <span className="adoption-health-badge adoption-health-badge--info">
                          <ShieldCheck size={15} />
                          Kısırlaştırılmış
                        </span>
                      )}
                    </div>

                    <div className="adoption-card__actions">
                      <Link
                        href={`/adoption/${pet.id}`}
                        className="pm-button pm-button--secondary"
                      >
                        Detayları Gör
                      </Link>

                      <Link
                        href={`/adoption/${pet.id}`}
                        className="pm-button pm-button--primary"
                      >
                        <Heart size={18} />
                        Sahiplen
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="adoption-empty pm-card">
              <span className="adoption-empty__icon">
                <Search size={32} />
              </span>

              <h3>Aramana uygun ilan bulunamadı</h3>

              <p>
                Filtreleri değiştirerek veya arama kelimesini
                temizleyerek tekrar deneyebilirsin.
              </p>

              <button
                type="button"
                className="pm-button pm-button--primary"
                onClick={resetFilters}
              >
                Filtreleri Temizle
              </button>
            </div>
          )}

          <section className="adoption-safety">
            <div className="adoption-safety__icon">
              <ShieldCheck size={32} />
            </div>

            <div className="adoption-safety__content">
              <span>Güvenli sahiplendirme</span>

              <h2>Dostlarımızın güvenliği her şeyden önemli</h2>

              <p>
                Hayvan sahiplenirken karşı tarafla mutlaka görüş,
                yaşam koşullarını değerlendir ve hiçbir kullanıcıya
                sahiplendirme karşılığında ödeme yapma.
              </p>
            </div>

            <Link href="/safety" className="pm-button pm-button--secondary">
              Güvenlik Rehberi
            </Link>
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}