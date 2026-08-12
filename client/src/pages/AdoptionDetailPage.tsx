import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Syringe,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useParams } from "wouter";

type Pet = {
  id: string;
  name: string;
  type: string;
  breed: string;
  gender: string;
  age: string;
  location: string;
  publishedAt: string;
  image: string;
  description: string;
  vaccinated: boolean;
  neutered: boolean;
  characteristics: string[];
  requirements: string[];
  owner: {
    name: string;
    initials: string;
    memberSince: string;
    verified: boolean;
  };
};

const pets: Pet[] = [
  {
    id: "1",
    name: "Maya",
    type: "Kedi",
    breed: "Tekir",
    gender: "Dişi",
    age: "1 yaşında",
    location: "Kadıköy, İstanbul",
    publishedAt: "2 gün önce",
    image:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=1600&q=85",
    description:
      "Maya insanlarla arası oldukça iyi, oyuncu ve sevgi dolu bir kedidir. Ev ortamına alışkındır ve tuvalet eğitimi vardır. Kendisine ömürlük, güvenli ve sıcak bir yuva arıyoruz.",
    vaccinated: true,
    neutered: true,
    characteristics: [
      "İnsanlarla iletişimi güçlü",
      "Ev ortamına alışkın",
      "Tuvalet eğitimli",
      "Oyuncu ve sevecen",
    ],
    requirements: [
      "Ev içerisinde güvenli şekilde bakılması",
      "Düzenli veteriner kontrollerinin yapılması",
      "Uzun süre yalnız bırakılmaması",
      "Ömürlük yuva yaklaşımıyla sahiplenilmesi",
    ],
    owner: {
      name: "Ayşe Yılmaz",
      initials: "AY",
      memberSince: "2025 yılından beri üye",
      verified: true,
    },
  },
  {
    id: "2",
    name: "Tarçın",
    type: "Köpek",
    breed: "Golden Retriever",
    gender: "Erkek",
    age: "2 yaşında",
    location: "İzmit, Kocaeli",
    publishedAt: "3 gün önce",
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1600&q=85",
    description:
      "Tarçın enerjik, sevecen ve çocuklarla oldukça uyumlu bir köpektir. Günlük yürüyüşlerini aksatmayacak, onunla vakit geçirecek ve aile bireyi olarak kabul edecek bir yuva arıyoruz.",
    vaccinated: true,
    neutered: false,
    characteristics: [
      "Çocuklarla uyumlu",
      "İnsanlarla iletişimi güçlü",
      "Enerjik ve oyuncu",
      "Temel komutları biliyor",
    ],
    requirements: [
      "Her gün düzenli yürüyüş yaptırılması",
      "Yeterli hareket alanı sağlanması",
      "Uzun süre yalnız bırakılmaması",
      "Aile bireyi olarak kabul edilmesi",
    ],
    owner: {
      name: "Mehmet Kaya",
      initials: "MK",
      memberSince: "2024 yılından beri üye",
      verified: true,
    },
  },
  {
    id: "3",
    name: "Luna",
    type: "Kedi",
    breed: "British Shorthair",
    gender: "Dişi",
    age: "8 aylık",
    location: "Nilüfer, Bursa",
    publishedAt: "Bugün",
    image:
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1600&q=85",
    description:
      "Luna sakin, uyumlu ve insanlarla iletişimi güçlü bir kedidir. Ev ortamına alışkındır. Sevgi dolu, sorumluluk sahibi ve güvenli bir aile arıyoruz.",
    vaccinated: true,
    neutered: false,
    characteristics: [
      "Sakin ve uyumlu",
      "Ev ortamına alışkın",
      "İnsanlarla arası iyi",
      "Oyuncaklarla oynamayı seviyor",
    ],
    requirements: [
      "Ev içerisinde bakılması",
      "Kaliteli mama ile beslenmesi",
      "Veteriner kontrollerinin aksatılmaması",
      "Güvenli pencere ve balkon koşullarının sağlanması",
    ],
    owner: {
      name: "Elif Demir",
      initials: "ED",
      memberSince: "2026 yılından beri üye",
      verified: true,
    },
  },
];

export default function AdoptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const [isFavorite, setIsFavorite] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const pet = pets.find((item) => item.id === id);

  useEffect(() => {
    if (!isModalOpen) return;

    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setIsSubmitted(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeWithEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [isModalOpen]);

  if (!pet) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-20">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <PawPrint size={32} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-950">
            İlan bulunamadı
          </h1>

          <p className="mt-2 leading-7 text-slate-500">
            Bu sahiplendirme ilanı kaldırılmış veya artık yayında olmayabilir.
          </p>

          <button
            type="button"
            onClick={() => navigate("/adoption")}
            className="mt-7 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
          >
            Sahiplendirme ilanlarına dön
          </button>
        </div>
      </main>
    );
  }

  const openApplicationModal = () => {
    setMessage(
      `${pet.name} için sahiplendirme başvurusu yapmak istiyorum. Uygun olduğunuzda benimle iletişime geçebilir misiniz?`,
    );
    setIsSubmitted(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSubmitted(false);
    setMessage("");
  };

  return (
    <>
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Üst navigasyon */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate("/adoption")}
              className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-600 transition hover:text-orange-500"
            >
              <ArrowLeft size={19} />
              Sahiplendirme ilanlarına dön
            </button>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Sahiplendirme</span>
              <ChevronRight size={15} />
              <span className="font-medium text-slate-600">{pet.name}</span>
            </div>
          </div>

          {/* Ana detay alanı */}
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
              {/* Görsel */}
              <div className="relative min-h-[420px] overflow-hidden bg-slate-100 lg:min-h-[620px]">
                <img
                  src={pet.image}
                  alt={`${pet.name} isimli ${pet.type}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-slate-950/50 to-transparent p-5 sm:p-7">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/90 px-4 py-2 text-sm font-bold text-slate-800 shadow-sm backdrop-blur">
                    <PawPrint size={16} className="text-orange-500" />
                    {pet.type}
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsFavorite((current) => !current)}
                    aria-label={
                      isFavorite
                        ? "Favorilerden kaldır"
                        : "Favorilere ekle"
                    }
                    className={`flex h-12 w-12 items-center justify-center rounded-full border shadow-lg backdrop-blur transition ${
                      isFavorite
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-white/50 bg-white/90 text-slate-600 hover:text-orange-500"
                    }`}
                  >
                    <Heart
                      size={22}
                      fill={isFavorite ? "currentColor" : "none"}
                    />
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent p-6 pt-24 text-white sm:p-8">
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={17} />
                      {pet.location}
                    </span>

                    <span className="inline-flex items-center gap-2">
                      <Clock3 size={17} />
                      {pet.publishedAt}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bilgiler */}
              <div className="flex flex-col p-6 sm:p-9 lg:p-10">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-orange-600">
                    <Sparkles size={17} />
                    Yeni bir yuva arıyor
                  </div>

                  <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                        {pet.name}
                      </h1>

                      <p className="mt-2 text-lg font-medium text-slate-500">
                        {pet.breed}
                      </p>
                    </div>

                    <span className="rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600">
                      {pet.gender}
                    </span>
                  </div>

                  <div className="mt-7 grid grid-cols-2 gap-3">
                    <InfoBox
                      icon={<CalendarDays size={20} />}
                      label="Yaş"
                      value={pet.age}
                    />

                    <InfoBox
                      icon={<PawPrint size={20} />}
                      label="Cinsiyet"
                      value={pet.gender}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <HealthBadge
                      icon={<Syringe size={17} />}
                      label={
                        pet.vaccinated
                          ? "Aşıları tamamlandı"
                          : "Aşı bilgisi belirtilmedi"
                      }
                      active={pet.vaccinated}
                    />

                    <HealthBadge
                      icon={<ShieldCheck size={17} />}
                      label={
                        pet.neutered
                          ? "Kısırlaştırılmış"
                          : "Kısırlaştırılmamış"
                      }
                      active={pet.neutered}
                    />
                  </div>

                  <div className="my-7 h-px bg-slate-100" />

                  <h2 className="text-lg font-bold text-slate-950">
                    {pet.name} hakkında
                  </h2>

                  <p className="mt-3 text-base leading-7 text-slate-600">
                    {pet.description}
                  </p>
                </div>

                <div className="mt-auto pt-8">
                  <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck
                        size={21}
                        className="mt-0.5 shrink-0 text-orange-500"
                      />

                      <div>
                        <p className="font-semibold text-slate-900">
                          Güvenli sahiplendirme
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Hayvanı ve ilan sahibini tanımadan ödeme yapma.
                          Sahiplendirme öncesinde yüz yüze görüş.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openApplicationModal}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600"
                  >
                    <Heart size={21} />
                    Sahiplenmek İstiyorum
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Alt bilgiler */}
          <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_1fr_0.85fr]">
            <DetailCard
              icon={<Sparkles size={21} />}
              title="Karakter özellikleri"
            >
              {pet.characteristics.map((item) => (
                <DetailItem key={item}>{item}</DetailItem>
              ))}
            </DetailCard>

            <DetailCard
              icon={<ShieldCheck size={21} />}
              title="Sahiplendirme şartları"
            >
              {pet.requirements.map((item) => (
                <DetailItem key={item}>{item}</DetailItem>
              ))}
            </DetailCard>

            {/* İlan sahibi */}
            <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-950">
                  İlan sahibi
                </h2>

                <UserRound size={21} className="text-slate-400" />
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-100 text-base font-bold text-orange-600">
                  {pet.owner.initials}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate font-bold text-slate-900">
                      {pet.owner.name}
                    </h3>

                    {pet.owner.verified && (
                      <BadgeCheck
                        size={18}
                        className="shrink-0 text-blue-500"
                      />
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {pet.owner.memberSince}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 size={17} />
                  Doğrulanmış kullanıcı
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  İletişim bilgileri yalnızca başvuru sonrasında paylaşılır.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/chat")}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              >
                <MessageCircle size={19} />
                Mesaj Gönder
              </button>
            </aside>
          </div>
        </div>
      </main>

      {/* Başvuru modalı */}
      {isModalOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
          onMouseDown={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="adoption-modal-title"
            className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    isSubmitted
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-orange-50 text-orange-500"
                  }`}
                >
                  {isSubmitted ? (
                    <CheckCircle2 size={23} />
                  ) : (
                    <Heart size={23} />
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Sahiplendirme başvurusu
                  </p>
                  <h2
                    id="adoption-modal-title"
                    className="font-bold text-slate-950"
                  >
                    {pet.name}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Pencereyi kapat"
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {!isSubmitted ? (
              <div className="p-6">
                <h3 className="text-2xl font-bold text-slate-950">
                  {pet.name}’e yuva olmak ister misin?
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  Kısa mesajın ilan sahibine gönderilecek. İlan sahibi
                  başvurunu inceleyerek seninle iletişime geçebilir.
                </p>

                <label
                  htmlFor="adoption-message"
                  className="mt-6 block text-sm font-bold text-slate-800"
                >
                  İlan sahibine mesajın
                </label>

                <textarea
                  id="adoption-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={500}
                  rows={5}
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />

                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Lütfen kendini kısaca tanıt.</span>
                  <span>{message.length}/500</span>
                </div>

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Vazgeç
                  </button>

                  <button
                    type="button"
                    disabled={!message.trim()}
                    onClick={() => setIsSubmitted(true)}
                    className="flex-1 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Başvuruyu Gönder
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={40} />
                </div>

                <h3 className="mt-6 text-2xl font-bold text-slate-950">
                  Başvurun alındı
                </h3>

                <p className="mx-auto mt-3 max-w-sm leading-7 text-slate-600">
                  {pet.name} için oluşturduğun sahiplendirme isteği ilan
                  sahibine iletildi.
                </p>

                <div className="mt-7 rounded-2xl bg-slate-50 p-4 text-left">
                  <p className="text-sm font-semibold text-slate-800">
                    Sonraki adım
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    İlan sahibi başvuruna yanıt verdiğinde bildirim
                    alacaksın.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-6 w-full rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600"
                >
                  Tamam
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

type InfoBoxProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function InfoBox({ icon, label, value }: InfoBoxProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-orange-500">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>

      <p className="mt-2 font-bold text-slate-800">{value}</p>
    </div>
  );
}

type HealthBadgeProps = {
  icon: ReactNode;
  label: string;
  active: boolean;
};

function HealthBadge({ icon, label, active }: HealthBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {icon}
      {label}
    </span>
  );
}

type DetailCardProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
};

function DetailCard({ icon, title, children }: DetailCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          {icon}
        </div>

        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      </div>

      <div className="mt-6 space-y-4">{children}</div>
    </section>
  );
}

function DetailItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <Check size={14} strokeWidth={3} />
      </span>

      <span className="leading-6 text-slate-600">{children}</span>
    </div>
  );
}
