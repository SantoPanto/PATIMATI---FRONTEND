import React from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  HandHeart,
  Heart,
  Info,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";

export type CreateAdType = "lost" | "found" | "adopt" | "help";

interface ThemeConfig {
  type: CreateAdType;
  tabLabel: string;
  route: string;
  badgeText: string;
  badgeIcon: React.ReactNode;
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
  
  // Tailwind color classes
  heroBgGradient: string;
  tabActiveClass: string;
  tabInactiveClass: string;
  badgeClass: string;
  titleHighlightClass: string;
  tipIconClass: string;
  sidebarCardIconBg: string;
  sidebarCardIconText: string;
  sidebarInfoBoxBg: string;
  sidebarInfoBoxBorder: string;
  sidebarInfoBoxIconText: string;
  sidebarInfoBoxTitleText: string;
  sidebarInfoBoxBodyText: string;

  tipsTitle: string;
  tips: string[];
  infoBoxTitle: string;
  infoBoxDescription: string;
}

const THEME_CONFIGS: Record<CreateAdType, ThemeConfig> = {
  lost: {
    type: "lost",
    tabLabel: "Kayıp İlanı",
    route: "/lost/create",
    badgeText: "Kayıp dostumu arıyorum",
    badgeIcon: <Search size={16} />,
    titlePrefix: "Kayıp dostunu ",
    titleHighlight: "birlikte bulalım.",
    subtitle:
      "Kaybolan evcil hayvanının detaylarını ve en son görüldüğü yeri paylaş. İlanın toplulukla ve haritayla anında paylaşılacak.",
    heroBgGradient:
      "bg-gradient-to-br from-[#FFF7ED] via-white to-[#FEF3C7] border-b border-[#FDBA74]/30",
    tabActiveClass:
      "bg-[#EA580C] text-white shadow-md shadow-orange-500/20 font-bold",
    tabInactiveClass:
      "text-[#64748B] hover:text-[#EA580C] hover:bg-orange-50/60 font-semibold",
    badgeClass:
      "border-[#FDBA74] bg-white text-[#EA580C] shadow-xs",
    titleHighlightClass: "text-[#EA580C]",
    tipIconClass: "text-[#EA580C]",
    sidebarCardIconBg: "bg-[#FFF7ED]",
    sidebarCardIconText: "text-[#EA580C]",
    sidebarInfoBoxBg: "bg-[#FFF7ED]",
    sidebarInfoBoxBorder: "border-[#FFEDD5]",
    sidebarInfoBoxIconText: "text-[#EA580C]",
    sidebarInfoBoxTitleText: "text-[#9A3412]",
    sidebarInfoBoxBodyText: "text-[#C2410C]",
    tipsTitle: "Daha hızlı eşleşme için",
    tips: [
      "Net ve güncel yüz/vücut fotoğrafları ekle.",
      "En son görüldüğü yeri ve tarihi eksiksiz belirt.",
      "Ayırt edici fiziksel izleri, tasma veya çip bilgisini yaz.",
      "İletişim bilgilerinin doğru olduğunu kontrol et.",
    ],
    infoBoxTitle: "Hızlı İhbar ve Destek",
    infoBoxDescription:
      "İlanın yayınlandıktan sonra bölgedeki hayvanseverlere ve haritaya anında işlenecektir. Şüpheli durumlara karşı dikkatli olun.",
  },
  found: {
    type: "found",
    tabLabel: "Bulundu İlanı",
    route: "/found/create",
    badgeText: "Bir dost buldum",
    badgeIcon: <Search size={16} />,
    titlePrefix: "Bulduğun dostu ",
    titleHighlight: "ailesine kavuşturalım.",
    subtitle:
      "Bulduğun hayvanın fotoğraflarını ve bulunduğu konumu paylaş. Detaylı bilgiler, sahibinin ilanı daha kolay fark etmesini sağlar.",
    heroBgGradient:
      "bg-gradient-to-br from-[#EFF6FF] via-white to-[#F0F9FF] border-b border-[#BFDBFE]/40",
    tabActiveClass:
      "bg-[#2563EB] text-white shadow-md shadow-blue-500/20 font-bold",
    tabInactiveClass:
      "text-[#64748B] hover:text-[#2563EB] hover:bg-blue-50/60 font-semibold",
    badgeClass:
      "border-[#BFDBFE] bg-white text-[#2563EB] shadow-xs",
    titleHighlightClass: "text-[#2563EB]",
    tipIconClass: "text-[#22C55E]",
    sidebarCardIconBg: "bg-[#EFF6FF]",
    sidebarCardIconText: "text-[#2563EB]",
    sidebarInfoBoxBg: "bg-[#EFF6FF]",
    sidebarInfoBoxBorder: "border-[#BFDBFE]",
    sidebarInfoBoxIconText: "text-[#2563EB]",
    sidebarInfoBoxTitleText: "text-[#1E3A8A]",
    sidebarInfoBoxBodyText: "text-[#1D4ED8]",
    tipsTitle: "Daha hızlı eşleşme için",
    tips: [
      "Hayvanın yüzünü net gösteren fotoğraf ekle.",
      "Bulunduğu konumu mümkün olduğunca doğru belirt.",
      "Tasma ve ayırt edici işaretleri mutlaka yaz.",
      "Bulunduğu tarihi doğru seç.",
    ],
    infoBoxTitle: "Güvenli teslim",
    infoBoxDescription:
      "Hayvanı teslim etmeden önce sahip olduğunu iddia eden kişiden fotoğraf, veteriner kaydı veya ayırt edici özellik doğrulaması iste.",
  },
  adopt: {
    type: "adopt",
    tabLabel: "Sahiplendirme İlanı",
    route: "/adopt/create",
    badgeText: "Yeni yuva bul",
    badgeIcon: <Heart size={16} />,
    titlePrefix: "Sahiplendirme ilanı ",
    titleHighlight: "oluştur.",
    subtitle:
      "Dostunun bilgilerini eksiksiz paylaş. Doğru bilgiler, onun için güvenli ve mutlu bir yuva bulunmasını kolaylaştırır.",
    heroBgGradient:
      "bg-gradient-to-br from-[#ECFDF5] via-white to-[#F0FDF4] border-b border-[#A7F3D0]/40",
    tabActiveClass:
      "bg-[#059669] text-white shadow-md shadow-emerald-500/20 font-bold",
    tabInactiveClass:
      "text-[#64748B] hover:text-[#059669] hover:bg-emerald-50/60 font-semibold",
    badgeClass:
      "border-[#A7F3D0] bg-white text-[#059669] shadow-xs",
    titleHighlightClass: "text-[#059669]",
    tipIconClass: "text-[#059669]",
    sidebarCardIconBg: "bg-[#ECFDF5]",
    sidebarCardIconText: "text-[#059669]",
    sidebarInfoBoxBg: "bg-[#ECFDF5]",
    sidebarInfoBoxBorder: "border-[#A7F3D0]",
    sidebarInfoBoxIconText: "text-[#059669]",
    sidebarInfoBoxTitleText: "text-[#064E3B]",
    sidebarInfoBoxBodyText: "text-[#047857]",
    tipsTitle: "Yuva bulmayı kolaylaştırın",
    tips: [
      "Dostunun sevimli ve net fotoğraflarını ekle.",
      "Yaş, cinsiyet, ırk ve sağlık bilgilerini açıkça yaz.",
      "Varsa aşı/kısırlaştırma durumunu ve huyunu belirt.",
      "Sahiplendirme şartlarını detaylıca ifade et.",
    ],
    infoBoxTitle: "Güvenli Sahiplendirme",
    infoBoxDescription:
      "Aile adaylarıyla görüşürken ev ortamı ve bakım sorumluluğu hakkında bilgi almayı ve sözleşmeli teslim yapmayı unutmayın.",
  },
  help: {
    type: "help",
    tabLabel: "Yardım İlanı",
    route: "/help/create",
    badgeText: "Yardıma ihtiyacı var",
    badgeIcon: <HandHeart size={16} />,
    titlePrefix: "Yardıma muhtaç dostu ",
    titleHighlight: "bildir.",
    subtitle:
      "Gördüğün yardıma muhtaç hayvan(lar)ın fotoğrafını ve durumunu paylaş. Çevrendeki hayvanseverler görüp yardımcı olabilir.",
    heroBgGradient:
      "bg-gradient-to-br from-[#ECFEFF] via-white to-[#CFFAFE] border-b border-[#A5F3FC]/40",
    tabActiveClass:
      "bg-[#0E7490] text-white shadow-md shadow-cyan-500/20 font-bold",
    tabInactiveClass:
      "text-[#64748B] hover:text-[#0E7490] hover:bg-cyan-50/60 font-semibold",
    badgeClass:
      "border-[#A5F3FC] bg-white text-[#0E7490] shadow-xs",
    titleHighlightClass: "text-[#0E7490]",
    tipIconClass: "text-[#0E7490]",
    sidebarCardIconBg: "bg-[#ECFEFF]",
    sidebarCardIconText: "text-[#0E7490]",
    sidebarInfoBoxBg: "bg-[#ECFEFF]",
    sidebarInfoBoxBorder: "border-[#A5F3FC]",
    sidebarInfoBoxIconText: "text-[#0E7490]",
    sidebarInfoBoxTitleText: "text-[#164E63]",
    sidebarInfoBoxBodyText: "text-[#0E7490]",
    tipsTitle: "Daha etkili bir çağrı için",
    tips: [
      "Durumu net gösteren güncel fotoğraf(lar) ekle.",
      "Kaç hayvan olduğunu ve durumlarını açıklamada belirt.",
      "Konumu mümkün olduğunca doğru işaretle.",
      "Acil bir durum varsa (yaralanma vb.) açıklamada vurgula.",
    ],
    infoBoxTitle: "Topluluk Desteği",
    infoBoxDescription:
      "İlanın yayınlandıktan sonra haritaya işlenecek ve çevrendeki hayvanseverler görebilecek. Acil/tıbbi durumlarda bir veteriner veya barınakla da iletişime geçmeyi düşün.",
  },
};

export interface TabConfig {
  type: CreateAdType;
  label: string;
  route: string;
  matchPaths: string[];
  icon: React.ReactNode;
}

export const TABS: TabConfig[] = [
  {
    type: "lost",
    label: "Kayıp",
    route: "/lost/create",
    matchPaths: ["/lost/create", "/add-listing"],
    icon: <Search size={16} />,
  },
  {
    type: "found",
    label: "Bulundu",
    route: "/found/create",
    matchPaths: ["/found/create"],
    icon: <MapPin size={16} />,
  },
  {
    type: "adopt",
    label: "Sahiplendirme",
    route: "/adopt/create",
    matchPaths: ["/adopt/create", "/adoption/create"],
    icon: <Heart size={16} />,
  },
  {
    type: "help",
    label: "Yardım",
    route: "/help/create",
    matchPaths: ["/help/create"],
    icon: <HandHeart size={16} />,
  },
];

interface CreateAdLayoutProps {
  activeType?: CreateAdType;
  children: React.ReactNode;
}

export default function CreateAdLayout({
  activeType,
  children,
}: CreateAdLayoutProps) {
  const [location, navigate] = useLocation();

  // Determine active tab based on URL pathname, or fallback to activeType prop
  const currentTab =
    TABS.find((tab) =>
      tab.matchPaths.some((path) => location.startsWith(path)),
    ) ||
    TABS.find((tab) => tab.type === activeType) ||
    TABS[0];

  const activeTabType = currentTab.type;
  const config = THEME_CONFIGS[activeTabType];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9]">
      <Header />

      <main>
        {/* Hero Section */}
        <section className={`transition-colors duration-300 ${config.heroBgGradient}`}>
          <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 md:py-12 lg:px-8">
            {/* Top Navigation Row: Back Button & Segmented Control */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#64748B] transition hover:text-[#0F172A]"
              >
                <ArrowLeft size={18} />
                Ana sayfaya dön
              </button>

              {/* Segmented Control Nav */}
              <div
                role="tablist"
                aria-label="İlan Türü Seçimi"
                className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-[#E2E8F0] bg-white/90 p-1.5 shadow-sm backdrop-blur-xs"
              >
                {TABS.map((tab) => {
                  const isActive = tab.type === activeTabType;
                  return (
                    <Link
                      key={tab.type}
                      href={tab.route}
                      role="tab"
                      aria-selected={isActive}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 ${
                        isActive
                          ? THEME_CONFIGS[tab.type].tabActiveClass
                          : THEME_CONFIGS[tab.type].tabInactiveClass
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Hero Content */}
            <div className="mt-8 max-w-3xl">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${config.badgeClass}`}
              >
                {config.badgeIcon}
                {config.badgeText}
              </span>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#0F172A] sm:text-5xl">
                {config.titlePrefix}
                <span className={`block ${config.titleHighlightClass}`}>
                  {config.titleHighlight}
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-[#64748B]">
                {config.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Two-Column Form & Sidebar Section */}
        <section className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
          {/* Main Form Left Column */}
          <div className="space-y-7">{children}</div>

          {/* Sticky Sidebar Right Column */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.sidebarCardIconBg} ${config.sidebarCardIconText}`}
              >
                <Info size={22} />
              </div>

              <h2 className="mt-5 text-lg font-bold">{config.tipsTitle}</h2>

              <div className="mt-5 space-y-4">
                {config.tips.map((tipText, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-[#475569] dark:text-slate-400">
                    <CheckCircle2
                      size={18}
                      className={`mt-0.5 shrink-0 ${config.tipIconClass}`}
                    />
                    <span>{tipText}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`rounded-3xl border ${config.sidebarInfoBoxBorder} ${config.sidebarInfoBoxBg} p-6`}
            >
              <ShieldCheck
                size={25}
                className={config.sidebarInfoBoxIconText}
              />

              <h3 className={`mt-4 font-bold ${config.sidebarInfoBoxTitleText}`}>
                {config.infoBoxTitle}
              </h3>

              <p className={`mt-2 text-sm leading-6 ${config.sidebarInfoBoxBodyText}`}>
                {config.infoBoxDescription}
              </p>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  );
}
