import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * PetShopProductDetailPage (yeni, plan §12/§B.5): ürün yüklenir, doğru
 * `productId` ile `PetShopProductReviewsSection` render edilir, 404 ->
 * bulunamadı durumu.
 */

const { getPublicProduct } = vi.hoisted(() => ({
  getPublicProduct: vi.fn(),
}));

vi.mock("wouter", () => ({
  useParams: () => ({ shopId: "9", productId: "41" }),
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("../services/petshopProducts", () => ({ getPublicProduct }));

vi.mock("../components/Header", () => ({ default: () => <header /> }));
vi.mock("../components/Footer", () => ({ default: () => <footer /> }));

vi.mock("../components/PetShopProductReviewsSection", () => ({
  default: ({ productId }: { productId: number }) => (
    <div data-testid="petshop-product-reviews-stub">productId:{productId}</div>
  ),
}));

import PetShopProductDetailPage from "./PetShopProductDetailPage";

const PRODUCT = {
  id: 41,
  petShopId: 9,
  name: "Kedi Maması 1kg",
  description: "Tahılsız kedi maması",
  price: 149.9,
  photoUrl: null,
  averageRating: 4.5,
  reviewCount: 2,
  createdAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-01T10:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PetShopProductDetailPage", () => {
  it("ürün yüklenir ve isim/fiyat/açıklama render edilir", async () => {
    getPublicProduct.mockResolvedValue(PRODUCT);

    render(<PetShopProductDetailPage />);

    await waitFor(() => expect(getPublicProduct).toHaveBeenCalledWith(41));
    expect(await screen.findByText("Kedi Maması 1kg")).toBeInTheDocument();
    expect(screen.getByText("₺149.90")).toBeInTheDocument();
    expect(screen.getByText("Tahılsız kedi maması")).toBeInTheDocument();
  });

  it("doğru productId ile PetShopProductReviewsSection render edilir", async () => {
    getPublicProduct.mockResolvedValue(PRODUCT);

    render(<PetShopProductDetailPage />);

    expect(await screen.findByTestId("petshop-product-reviews-stub")).toHaveTextContent(
      "productId:41",
    );
  });

  it("404 (null) durumunda 'Ürün bulunamadı.' gösterir", async () => {
    getPublicProduct.mockResolvedValue(null);

    render(<PetShopProductDetailPage />);

    expect(await screen.findByText("Ürün bulunamadı.")).toBeInTheDocument();
  });

  it("dükkana dönüş linki doğru shopId'ye gider", async () => {
    getPublicProduct.mockResolvedValue(PRODUCT);

    render(<PetShopProductDetailPage />);

    await screen.findByText("Kedi Maması 1kg");
    const backLink = screen.getByText(/Dükkana dön/).closest("a");
    expect(backLink).toHaveAttribute("href", "/hizmetler/petshop/9");
  });
});
