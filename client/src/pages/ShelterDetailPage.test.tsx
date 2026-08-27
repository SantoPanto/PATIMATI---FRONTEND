import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ShelterDetailPage -- Vet (yorumlar) ve Petshop (ürün/ilan grid'i)
 * desenlerinin ikisini birden içerir (plan §15, §B.2): kart bilgisi +
 * salt-okunur `MapPicker` + `ShelterReviewsSection` (barınak seviyesinde) +
 * sahiplendirme ilanları grid'i (`listShelterAdoptions`'tan). Her kart
 * tıklaması mevcut `/adoption/{id}` rotasına gider -- barınağa özel yeni bir
 * ilan-detay rotası YOK.
 *
 * <p>Gerçek Leaflet/jsdom ağır olduğundan `MapPicker` bir stub'a, puan/yorum
 * bölümü de kendi testinde zaten ölçüldüğü için bir stub'a indirgeniyor
 * (VetDetailPage.test.tsx/PetShopDetailPage.test.tsx ile aynı mock şekli).
 */

const { navigate, getShelter, listShelterAdoptions } = vi.hoisted(() => ({
  navigate: vi.fn(),
  getShelter: vi.fn(),
  listShelterAdoptions: vi.fn(),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/hizmetler/barinak/9", navigate] as const,
  useParams: () => ({ id: "9" }),
  Link: ({ href, children, className }: { href: string; children?: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("../services/shelter", () => ({ getShelter, listShelterAdoptions }));

vi.mock("../components/Header", () => ({ default: () => <header /> }));
vi.mock("../components/Footer", () => ({ default: () => <footer /> }));

vi.mock("../components/MapPicker", () => ({
  default: ({ latitude, longitude, readOnly }: { latitude?: number | null; longitude?: number | null; readOnly?: boolean }) => (
    <div data-testid="map-picker-stub" data-readonly={readOnly ? "true" : "false"}>
      {latitude}, {longitude}
    </div>
  ),
}));

vi.mock("../components/ShelterReviewsSection", () => ({
  default: ({ shelterId }: { shelterId: number }) => (
    <div data-testid="shelter-reviews-section-stub">shelterId:{shelterId}</div>
  ),
}));

import ShelterDetailPage from "./ShelterDetailPage";

const BARINAK_TEMEL = {
  id: 9,
  name: "Umut Barınağı",
  address: "Örnek Mah.",
  city: "Ankara",
  district: "Çankaya",
  phone: "0312 000 00 00",
  workingHours: "Hafta içi 09:00 - 18:00",
  photoUrl: null,
  latitude: null as number | null,
  longitude: null as number | null,
  averageRating: null as number | null,
  reviewCount: 0,
};

function adPage(content: unknown[]) {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: content.length === 0,
  };
}

const ADOPTION_AD = {
  id: 55,
  title: "Sahiplendirilecek Kedi",
  description: "Açıklama",
  adType: "ADOPTION",
  species: "CAT",
  breed: "Tekir",
  colors: [],
  gender: "FEMALE",
  ageGroup: "YOUNG",
  coatPattern: "SOLID",
  collarStatus: "UNKNOWN",
  earTagStatus: "UNKNOWN",
  earNotchStatus: "UNKNOWN",
  microchipped: false,
  photoUrls: [],
  latitude: 40.1,
  longitude: 29.5,
  ownerId: 3,
  ownerDisplayName: "Umut Barınağı",
  active: true,
  suspended: false,
  createdAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-01T10:00:00Z",
  city: "Ankara",
  district: "Çankaya",
};

beforeEach(() => {
  vi.clearAllMocks();
  listShelterAdoptions.mockResolvedValue(adPage([]));
});

describe("ShelterDetailPage — bulunamadı/yükleniyor", () => {
  it("yüklenirken 'Yükleniyor...' gösterir", () => {
    getShelter.mockReturnValue(new Promise(() => {}));

    render(<ShelterDetailPage />);

    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
  });

  it("bulunamayan barınakta 'Barınak bulunamadı.' gösterir", async () => {
    getShelter.mockResolvedValue(null);

    render(<ShelterDetailPage />);

    expect(await screen.findByText("Barınak bulunamadı.")).toBeInTheDocument();
  });
});

describe("ShelterDetailPage — kart bilgisi", () => {
  it("barınak bilgileri render edilir", async () => {
    getShelter.mockResolvedValue(BARINAK_TEMEL);

    render(<ShelterDetailPage />);

    expect(await screen.findByText("Umut Barınağı")).toBeInTheDocument();
    expect(screen.getByText("0312 000 00 00")).toBeInTheDocument();
    expect(screen.getByText("Hafta içi 09:00 - 18:00")).toBeInTheDocument();
  });

  it("konumlu barınakta MapPicker readOnly render edilir", async () => {
    getShelter.mockResolvedValue({ ...BARINAK_TEMEL, latitude: 40.1, longitude: 29.5 });

    render(<ShelterDetailPage />);

    const map = await screen.findByTestId("map-picker-stub");
    expect(map).toHaveAttribute("data-readonly", "true");
  });
});

describe("ShelterDetailPage — puan/yorum bölümü", () => {
  it("ShelterReviewsSection doğru shelterId ile render edilir", async () => {
    getShelter.mockResolvedValue(BARINAK_TEMEL);

    render(<ShelterDetailPage />);

    expect(await screen.findByTestId("shelter-reviews-section-stub")).toHaveTextContent(
      "shelterId:9",
    );
  });
});

describe("ShelterDetailPage — sahiplendirme ilanları grid'i", () => {
  it("listShelterAdoptions'tan ilanlar render edilir", async () => {
    getShelter.mockResolvedValue(BARINAK_TEMEL);
    listShelterAdoptions.mockResolvedValue(adPage([ADOPTION_AD]));

    render(<ShelterDetailPage />);

    await waitFor(() => expect(listShelterAdoptions).toHaveBeenCalledWith(9, { size: 3 }));
    expect(await screen.findByText("Sahiplendirilecek Kedi")).toBeInTheDocument();
  });

  it("boş grid'de 'Bu barınakta şu anda sahiplendirme ilanı yok.' gösterir", async () => {
    getShelter.mockResolvedValue(BARINAK_TEMEL);
    listShelterAdoptions.mockResolvedValue(adPage([]));

    render(<ShelterDetailPage />);

    expect(
      await screen.findByText("Bu barınakta şu anda sahiplendirme ilanı yok."),
    ).toBeInTheDocument();
  });

  it("bir ilana tıklanınca mevcut /adoption/{id} rotasına gider (barınağa özel bir rota DEĞİL)", async () => {
    getShelter.mockResolvedValue(BARINAK_TEMEL);
    listShelterAdoptions.mockResolvedValue(adPage([ADOPTION_AD]));

    render(<ShelterDetailPage />);

    const card = await screen.findByText("Sahiplendirilecek Kedi");
    fireEvent.click(card);

    expect(navigate).toHaveBeenCalledWith("/adoption/55");
  });

  it("'Tüm İlanları Gör' butonu doğru rotaya bağlanır", async () => {
    getShelter.mockResolvedValue(BARINAK_TEMEL);
    listShelterAdoptions.mockResolvedValue(adPage([ADOPTION_AD]));

    render(<ShelterDetailPage />);

    const link = await screen.findByText("Tüm İlanları Gör");
    expect(link.closest("a")).toHaveAttribute("href", "/hizmetler/barinak/9/ilanlar");
  });
});
