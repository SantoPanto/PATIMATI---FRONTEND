import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ShelterAdoptionsPage -- `PetShopProductsPage.test.tsx` ile aynı üsluptaki,
 * ama barınağın TÜM sahiplendirme ilanları için. `ShelterDetailPage`'deki
 * "Son Sahiplendirme İlanları" önizlemesinin "Tüm İlanları Gör" butonuyla
 * açtığı sayfa.
 */

const { navigate, getShelter, listShelterAdoptions } = vi.hoisted(() => ({
  navigate: vi.fn(),
  getShelter: vi.fn(),
  listShelterAdoptions: vi.fn(),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/hizmetler/barinak/9/ilanlar", navigate] as const,
  useParams: () => ({ id: "9" }),
}));

vi.mock("../services/shelter", () => ({ getShelter, listShelterAdoptions }));

vi.mock("../components/Header", () => ({ default: () => <header /> }));
vi.mock("../components/Footer", () => ({ default: () => <footer /> }));

import ShelterAdoptionsPage from "./ShelterAdoptionsPage";

const SHELTER = {
  id: 9,
  name: "Umut Barınağı",
  address: "Örnek Mah.",
  city: "Ankara",
  district: "Çankaya",
  phone: "0312 000 00 00",
  workingHours: "Hafta içi 09:00 - 18:00",
  photoUrl: null,
  latitude: null,
  longitude: null,
  averageRating: null,
  reviewCount: 0,
};

function adPage(content: unknown[], overrides?: Partial<Record<string, unknown>>) {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: content.length === 0,
    ...overrides,
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
};

beforeEach(() => {
  vi.clearAllMocks();
  getShelter.mockResolvedValue(SHELTER);
  listShelterAdoptions.mockResolvedValue(adPage([]));
});

describe("ShelterAdoptionsPage", () => {
  it("tüm ilanları sayfalı olarak çeker ve render eder", async () => {
    listShelterAdoptions.mockResolvedValue(adPage([ADOPTION_AD]));

    render(<ShelterAdoptionsPage />);

    await waitFor(() =>
      expect(listShelterAdoptions).toHaveBeenCalledWith(9, { page: 0, size: 20 }),
    );
    expect(await screen.findByText("Sahiplendirilecek Kedi")).toBeInTheDocument();
  });

  it("ilan yoksa boş durum mesajı gösterir", async () => {
    render(<ShelterAdoptionsPage />);

    expect(
      await screen.findByText("Bu barınakta şu anda sahiplendirme ilanı yok."),
    ).toBeInTheDocument();
  });

  it("bir ilana tıklanınca doğru rotaya gider", async () => {
    listShelterAdoptions.mockResolvedValue(adPage([ADOPTION_AD]));

    render(<ShelterAdoptionsPage />);

    const card = await screen.findByText("Sahiplendirilecek Kedi");
    fireEvent.click(card);

    expect(navigate).toHaveBeenCalledWith("/adoption/55");
  });

  it("birden fazla sayfa varsa sayfalama kontrolleri görünür ve sonraki sayfayı çeker", async () => {
    listShelterAdoptions.mockResolvedValue(adPage([ADOPTION_AD], { totalPages: 2 }));

    render(<ShelterAdoptionsPage />);

    await screen.findByText("Sahiplendirilecek Kedi");
    fireEvent.click(screen.getByRole("button", { name: "Sonraki sayfa" }));

    await waitFor(() =>
      expect(listShelterAdoptions).toHaveBeenCalledWith(9, { page: 1, size: 20 }),
    );
  });
});
