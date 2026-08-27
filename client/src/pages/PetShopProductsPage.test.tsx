import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * PetShopProductsPage -- `PetShopDetailPage.test.tsx`teki ürün listesi
 * testleriyle aynı üsluptaki, ama TAM sayfalı grid + "Tüm Ürünler" görünümü
 * için. `PetShopDetailPage`'deki "Öne Çıkan Ürünler" önizlemesinin "Tüm
 * Ürünleri Gör" butonuyla açtığı sayfa.
 */

const { navigate, getPetShop, listShopProducts } = vi.hoisted(() => ({
  navigate: vi.fn(),
  getPetShop: vi.fn(),
  listShopProducts: vi.fn(),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/hizmetler/petshop/9/urunler", navigate] as const,
  useParams: () => ({ id: "9" }),
}));

vi.mock("../services/petshop", () => ({ getPetShop }));
vi.mock("../services/petshopProducts", () => ({ listShopProducts }));

vi.mock("../components/Header", () => ({ default: () => <header /> }));
vi.mock("../components/Footer", () => ({ default: () => <footer /> }));

import PetShopProductsPage from "./PetShopProductsPage";

const SHOP = {
  id: 9,
  name: "Pati Petshop",
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

function productPage(content: unknown[], overrides?: Partial<Record<string, unknown>>) {
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
  getPetShop.mockResolvedValue(SHOP);
  listShopProducts.mockResolvedValue(productPage([]));
});

describe("PetShopProductsPage", () => {
  it("tüm ürünleri sayfalı olarak çeker ve render eder", async () => {
    listShopProducts.mockResolvedValue(productPage([PRODUCT_1]));

    render(<PetShopProductsPage />);

    await waitFor(() => expect(listShopProducts).toHaveBeenCalledWith(9, { page: 0, size: 20 }));
    expect(await screen.findByText("Kedi Maması 1kg")).toBeInTheDocument();
  });

  it("ürün yoksa boş durum mesajı gösterir", async () => {
    render(<PetShopProductsPage />);

    expect(await screen.findByText("Bu dükkanda henüz bir ürün yok.")).toBeInTheDocument();
  });

  it("bir ürüne tıklanınca doğru rotaya gider", async () => {
    listShopProducts.mockResolvedValue(productPage([PRODUCT_1]));

    render(<PetShopProductsPage />);

    const productCard = await screen.findByText("Kedi Maması 1kg");
    fireEvent.click(productCard);

    expect(navigate).toHaveBeenCalledWith("/hizmetler/petshop/9/urun/41");
  });

  it("birden fazla sayfa varsa sayfalama kontrolleri görünür ve sonraki sayfayı çeker", async () => {
    listShopProducts.mockResolvedValue(productPage([PRODUCT_1], { totalPages: 2 }));

    render(<PetShopProductsPage />);

    await screen.findByText("Kedi Maması 1kg");
    fireEvent.click(screen.getByRole("button", { name: "Sonraki sayfa" }));

    await waitFor(() => expect(listShopProducts).toHaveBeenCalledWith(9, { page: 1, size: 20 }));
  });
});
