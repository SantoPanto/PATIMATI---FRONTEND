import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * PetShopDetailPage -- `VetDetailPage.test.tsx` eksi müşteri-isteği-butonu
 * testleri; ürün listesi render + tıklama doğru rotaya gider (plan §B.4).
 *
 * Gerçek Leaflet/jsdom ağır olduğundan `MapPicker` test-id'li bir stub'a
 * indirgeniyor.
 */

const { navigate, getPetShop, listShopProducts } = vi.hoisted(() => ({
  navigate: vi.fn(),
  getPetShop: vi.fn(),
  listShopProducts: vi.fn(),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/hizmetler/petshop/9", navigate] as const,
  useParams: () => ({ id: "9" }),
  Link: ({ href, children, ...rest }: { href: string; children?: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("../services/petshop", () => ({ getPetShop }));
vi.mock("../services/petshopProducts", () => ({ listShopProducts }));

vi.mock("../components/Header", () => ({ default: () => <header /> }));
vi.mock("../components/Footer", () => ({ default: () => <footer /> }));
vi.mock("../components/PetShopReviewsSection", () => ({
  default: ({ petShopId }: { petShopId: number }) => (
    <div data-testid="petshop-reviews-section-stub">petShopId:{petShopId}</div>
  ),
}));

vi.mock("../components/MapPicker", () => ({
  default: ({ latitude, longitude, readOnly }: { latitude?: number | null; longitude?: number | null; readOnly?: boolean }) => (
    <div data-testid="map-picker-stub" data-readonly={readOnly ? "true" : "false"}>
      {latitude}, {longitude}
    </div>
  ),
}));

import PetShopDetailPage from "./PetShopDetailPage";

const SHOP_TEMEL = {
  id: 9,
  name: "Pati Petshop",
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

function productPage(content: unknown[]) {
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

const PRODUCT_1 = {
  id: 41,
  petShopId: 9,
  name: "Kedi Maması 1kg",
  description: "Açıklama",
  price: 149.9,
  photoUrl: null,
  averageRating: 4.2,
  reviewCount: 3,
  createdAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-01T10:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  listShopProducts.mockResolvedValue(productPage([]));
});

describe("PetShopDetailPage — konum", () => {
  it("konumlu dükkanda MapPicker readOnly render edilir", async () => {
    getPetShop.mockResolvedValue({ ...SHOP_TEMEL, latitude: 40.1, longitude: 29.5 });

    render(<PetShopDetailPage />);

    const map = await screen.findByTestId("map-picker-stub");
    expect(map).toHaveAttribute("data-readonly", "true");
    expect(map).toHaveTextContent("40.1, 29.5");
  });

  it("konumsuz dükkanda harita hiç render edilmez", async () => {
    getPetShop.mockResolvedValue({ ...SHOP_TEMEL, latitude: null, longitude: null });

    render(<PetShopDetailPage />);

    await waitFor(() => expect(getPetShop).toHaveBeenCalled());
    await screen.findByText("Pati Petshop");
    expect(screen.queryByTestId("map-picker-stub")).toBeNull();
  });
});

describe("PetShopDetailPage — müşteri isteği YOK", () => {
  it("'Müşteri İsteği Gönder' butonu render edilmez", async () => {
    getPetShop.mockResolvedValue(SHOP_TEMEL);

    render(<PetShopDetailPage />);

    await screen.findByText("Pati Petshop");
    expect(screen.queryByText(/Müşteri İsteği Gönder/)).toBeNull();
  });
});

describe("PetShopDetailPage — ürün listesi", () => {
  it("ürünler yüklenir ve render edilir", async () => {
    getPetShop.mockResolvedValue(SHOP_TEMEL);
    listShopProducts.mockResolvedValue(productPage([PRODUCT_1]));

    render(<PetShopDetailPage />);

    await waitFor(() => expect(listShopProducts).toHaveBeenCalledWith(9, { size: 3 }));
    expect(await screen.findByText("Kedi Maması 1kg")).toBeInTheDocument();
    expect(screen.getByText("₺149.90")).toBeInTheDocument();
  });

  it("ürün yoksa boş durum mesajı gösterir", async () => {
    getPetShop.mockResolvedValue(SHOP_TEMEL);
    listShopProducts.mockResolvedValue(productPage([]));

    render(<PetShopDetailPage />);

    expect(await screen.findByText("Bu dükkanda henüz bir ürün yok.")).toBeInTheDocument();
  });

  it("bir ürüne tıklanınca doğru rotaya (/hizmetler/petshop/{shopId}/urun/{productId}) gider", async () => {
    getPetShop.mockResolvedValue(SHOP_TEMEL);
    listShopProducts.mockResolvedValue(productPage([PRODUCT_1]));

    render(<PetShopDetailPage />);

    const productCard = await screen.findByText("Kedi Maması 1kg");
    fireEvent.click(productCard);

    expect(navigate).toHaveBeenCalledWith("/hizmetler/petshop/9/urun/41");
  });

  it("'Tüm Ürünleri Gör' butonu doğru rotaya bağlanır", async () => {
    getPetShop.mockResolvedValue(SHOP_TEMEL);
    listShopProducts.mockResolvedValue(productPage([PRODUCT_1]));

    render(<PetShopDetailPage />);

    const link = await screen.findByText("Tüm Ürünleri Gör");
    expect(link.closest("a")).toHaveAttribute("href", "/hizmetler/petshop/9/urunler");
  });
});

describe("PetShopDetailPage — dükkan seviyesi yorumlar", () => {
  it("PetShopReviewsSection doğru petShopId ile render edilir", async () => {
    getPetShop.mockResolvedValue(SHOP_TEMEL);

    render(<PetShopDetailPage />);

    const stub = await screen.findByTestId("petshop-reviews-section-stub");
    expect(stub).toHaveTextContent("petShopId:9");
  });
});

describe("PetShopDetailPage — dükkan seviyesi ortalama puan", () => {
  it("yorum yoksa 'Henüz değerlendirme yok' gösterir", async () => {
    getPetShop.mockResolvedValue(SHOP_TEMEL);

    render(<PetShopDetailPage />);

    expect(await screen.findByText("Henüz değerlendirme yok")).toBeInTheDocument();
  });

  it("yorum varsa ortalama puan + sayısını gösterir", async () => {
    getPetShop.mockResolvedValue({ ...SHOP_TEMEL, averageRating: 4.5, reviewCount: 2 });

    render(<PetShopDetailPage />);

    expect(await screen.findByText("4.5 (2)")).toBeInTheDocument();
  });
});
