import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ShelterPanelPage -- 2 sekmeli panel (plan §14, §B.1): "Barınak Kartı" +
 * "İlanlarım". Kart yükleme/kaydetme + konum (`PetShopPanelPage` deseni,
 * hayvan türü seçici YOK). "İlanlarım" sekmesi `AdoptionCreatePage.tsx`'i
 * YENİDEN YAZMIYOR: `/adopt/create`'e giden bir link + `getMyAds`'ten
 * yalnızca `adType === "ADOPTION"` filtrelenen bir liste, mevcut
 * `deleteAd`/`republishAd`/`resolveAdoptionAdopted` fonksiyonlarını
 * kullanarak (plan "Bilinçli kapsam sınırları").
 *
 * <p><b>Regresyon güvencesi:</b> diğer panellerin sekme isimlerinin
 * ("Ürünlerim", "Gelen İstekler", "Müşterilerim") SIZMADIĞINI doğrular.
 *
 * <p>Gerçek Leaflet/jsdom ağır olduğundan `MapPicker` test-id'li bir stub'a
 * indirgeniyor (PetShopPanelPage.test.tsx ile aynı mock şekli).
 */

const { getMyShelter, upsertMyShelter } = vi.hoisted(() => ({
  getMyShelter: vi.fn(),
  upsertMyShelter: vi.fn(),
}));

const { getMyAds, deleteAd, republishAd } = vi.hoisted(() => ({
  getMyAds: vi.fn(),
  deleteAd: vi.fn(),
  republishAd: vi.fn(),
}));

const { resolveAdoptionAdopted } = vi.hoisted(() => ({
  resolveAdoptionAdopted: vi.fn(),
}));

vi.mock("../services/shelter", () => ({ getMyShelter, upsertMyShelter }));
vi.mock("../services/ads", () => ({ getMyAds, deleteAd, republishAd }));
vi.mock("../services/adoptions", () => ({ resolveAdoptionAdopted }));

vi.mock("../components/Header", () => ({ default: () => <header /> }));
vi.mock("../components/Footer", () => ({ default: () => <footer /> }));

vi.mock("../components/MapPicker", () => ({
  default: ({
    latitude,
    longitude,
    onChange,
  }: {
    latitude?: number | null;
    longitude?: number | null;
    onChange?: (lat: number, lng: number) => void;
  }) => (
    <div data-testid="map-picker-stub">
      <span data-testid="map-lat">{latitude ?? ""}</span>
      <span data-testid="map-lng">{longitude ?? ""}</span>
      <button type="button" onClick={() => onChange?.(40.1, 29.5)}>
        haritada-konum-sec
      </button>
    </div>
  ),
}));

import ShelterPanelPage from "./ShelterPanelPage";

function stub<T>(fn: ReturnType<typeof vi.fn>, value: T) {
  fn.mockResolvedValue(value);
}

function adPage(content: unknown[]) {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: 100,
    number: 0,
    first: true,
    last: true,
    empty: content.length === 0,
  };
}

const ADOPTION_AD = {
  id: 101,
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
  ownerDisplayName: "Barınak",
  active: true,
  suspended: false,
  createdAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-01T10:00:00Z",
  city: "Ankara",
  district: "Çankaya",
};

const LOST_AD = {
  ...ADOPTION_AD,
  id: 102,
  title: "Kayıp Köpek",
  adType: "LOST",
};

const FOUND_AD = {
  ...ADOPTION_AD,
  id: 103,
  title: "Bulunan Köpek",
  adType: "FOUND",
};

beforeEach(() => {
  vi.clearAllMocks();
  stub(getMyShelter, null);
  stub(upsertMyShelter, {
    id: 3,
    name: "Umut Barınağı",
    address: "Adres",
    city: "Ankara",
    district: null,
    phone: "0312 000 00 00",
    workingHours: null,
    photoUrl: null,
    latitude: 40.1,
    longitude: 29.5,
    averageRating: null,
    reviewCount: 0,
  });
  stub(getMyAds, adPage([]));
  stub(deleteAd, undefined);
  stub(republishAd, { ...ADOPTION_AD, active: true });
  stub(resolveAdoptionAdopted, { message: "ok" });
});

function tabButtons() {
  return screen
    .getAllByRole("button")
    .filter((button) =>
      ["Barınak Kartı", "İlanlarım"].includes(button.textContent?.trim() ?? ""),
    );
}

describe("ShelterPanelPage — sekmeler", () => {
  it("yalnızca 'Barınak Kartı' ve 'İlanlarım' sekmeleri render edilir", async () => {
    render(<ShelterPanelPage />);

    await waitFor(() => expect(getMyShelter).toHaveBeenCalled());

    const labels = tabButtons().map((button) => button.textContent?.trim());
    expect(labels).toEqual(["Barınak Kartı", "İlanlarım"]);
  });

  it("diğer panellerin sekme isimleri HİÇ render edilmez", async () => {
    render(<ShelterPanelPage />);

    await waitFor(() => expect(getMyShelter).toHaveBeenCalled());

    expect(screen.queryByText("Ürünlerim")).toBeNull();
    expect(screen.queryByText("Gelen İstekler")).toBeNull();
    expect(screen.queryByText("Müşterilerim")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /İlanlarım/ }));
    await waitFor(() => expect(getMyAds).toHaveBeenCalled());

    expect(screen.queryByText("Ürünlerim")).toBeNull();
    expect(screen.queryByText("Gelen İstekler")).toBeNull();
    expect(screen.queryByText("Müşterilerim")).toBeNull();
  });

  it("varsayılan aktif sekme Barınak Kartı'dır", async () => {
    render(<ShelterPanelPage />);

    await waitFor(() => expect(getMyShelter).toHaveBeenCalled());

    expect(screen.getByPlaceholderText("Umut Barınağı")).toBeInTheDocument();
    expect(getMyAds).not.toHaveBeenCalled();
  });
});

describe("ShelterPanelPage — Barınak Kartı: konum", () => {
  it("mock'lanmış MapPicker render edilir, hayvan türü seçici YOK", async () => {
    render(<ShelterPanelPage />);

    await waitFor(() => expect(getMyShelter).toHaveBeenCalled());

    expect(screen.getByTestId("map-picker-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("animal-type-selector-stub")).toBeNull();
  });

  it("harita onChange'i tetiklenince state günceller ve kayıt isteğine latitude/longitude dahil olur", async () => {
    render(<ShelterPanelPage />);

    await waitFor(() => expect(getMyShelter).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText("Umut Barınağı"), {
      target: { value: "Umut Barınağı" },
    });
    fireEvent.change(screen.getByPlaceholderText("Örnek Mah. 1. Sk. No:1"), {
      target: { value: "Adres" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ankara"), {
      target: { value: "Ankara" },
    });
    fireEvent.change(screen.getByPlaceholderText("0312 000 00 00"), {
      target: { value: "0312 000 00 00" },
    });

    fireEvent.click(screen.getByText("haritada-konum-sec"));
    expect(screen.getByTestId("map-lat")).toHaveTextContent("40.1");
    expect(screen.getByTestId("map-lng")).toHaveTextContent("29.5");

    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() =>
      expect(upsertMyShelter).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 40.1,
          longitude: 29.5,
        }),
      ),
    );
  });
});

describe("ShelterPanelPage — İlanlarım", () => {
  it("getMyAds'ten yalnızca ADOPTION tipini filtreler", async () => {
    stub(getMyAds, adPage([ADOPTION_AD, LOST_AD, FOUND_AD]));

    render(<ShelterPanelPage />);
    await waitFor(() => expect(getMyShelter).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /İlanlarım/ }));

    expect(await screen.findByText("Sahiplendirilecek Kedi")).toBeInTheDocument();
    expect(screen.queryByText("Kayıp Köpek")).toBeNull();
    expect(screen.queryByText("Bulunan Köpek")).toBeNull();
  });

  it("boş listede 'Henüz bir sahiplendirme ilanınız yok.' gösterir", async () => {
    render(<ShelterPanelPage />);
    await waitFor(() => expect(getMyShelter).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /İlanlarım/ }));

    expect(
      await screen.findByText("Henüz bir sahiplendirme ilanınız yok."),
    ).toBeInTheDocument();
  });

  it("'Yeni İlan Ver' linki /adopt/create'e gider", async () => {
    render(<ShelterPanelPage />);
    await waitFor(() => expect(getMyShelter).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /İlanlarım/ }));
    await waitFor(() => expect(getMyAds).toHaveBeenCalled());

    const link = screen.getByRole("link", { name: /Yeni İlan Ver/ });
    expect(link).toHaveAttribute("href", "/adopt/create");
  });

  it("aktif ilanda 'Yayından kaldır' onaylanınca deleteAd doğru id ile çağrılır", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    stub(getMyAds, adPage([ADOPTION_AD]));

    render(<ShelterPanelPage />);
    await waitFor(() => expect(getMyShelter).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /İlanlarım/ }));
    await screen.findByText("Sahiplendirilecek Kedi");

    fireEvent.click(screen.getByRole("button", { name: /Yayından kaldır/ }));

    await waitFor(() => expect(deleteAd).toHaveBeenCalledWith(101));
  });

  it("aktif ilanda 'Sahiplendirildi olarak işaretle' resolveAdoptionAdopted'ı doğru id ile çağırır", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    stub(getMyAds, adPage([ADOPTION_AD]));

    render(<ShelterPanelPage />);
    await waitFor(() => expect(getMyShelter).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /İlanlarım/ }));
    await screen.findByText("Sahiplendirilecek Kedi");

    fireEvent.click(screen.getByRole("button", { name: /Sahiplendirildi olarak işaretle/ }));

    await waitFor(() => expect(resolveAdoptionAdopted).toHaveBeenCalledWith(101));
  });

  it("pasif ve askıya alınmamış ilanda 'Yeniden yayınla' republishAd'ı doğru id ile çağırır", async () => {
    stub(getMyAds, adPage([{ ...ADOPTION_AD, active: false, suspended: false }]));

    render(<ShelterPanelPage />);
    await waitFor(() => expect(getMyShelter).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /İlanlarım/ }));
    await screen.findByText("Sahiplendirilecek Kedi");

    fireEvent.click(screen.getByRole("button", { name: /Yeniden yayınla/ }));

    await waitFor(() => expect(republishAd).toHaveBeenCalledWith(101));
  });

  it("askıya alınmış ilanda salt-okunur rozet gösterilir, düğme YOK", async () => {
    stub(getMyAds, adPage([{ ...ADOPTION_AD, active: false, suspended: true }]));

    render(<ShelterPanelPage />);
    await waitFor(() => expect(getMyShelter).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /İlanlarım/ }));
    await screen.findByText("Sahiplendirilecek Kedi");

    expect(screen.getAllByText(/İnceleme altında/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Yeniden yayınla/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Yayından kaldır/ })).toBeNull();
  });

  it("sahiplendirilmiş (ADOPTED) ilanda salt-okunur rozet gösterilir, 'Yeniden yayınla' YOK", async () => {
    stub(
      getMyAds,
      adPage([
        { ...ADOPTION_AD, active: false, suspended: false, resolutionStatus: "ADOPTED" },
      ]),
    );

    render(<ShelterPanelPage />);
    await waitFor(() => expect(getMyShelter).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /İlanlarım/ }));
    await screen.findByText("Sahiplendirilecek Kedi");

    expect(screen.getAllByText(/Sahiplendirildi/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Yeniden yayınla/ })).toBeNull();
  });
});
