import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Ürün puan/yorum bölümü (plan §11, §B.2) -- `VetClinicReviewsSection.test.tsx`
 * neyi kapsıyorsa onun aynısı: liste, boş durum, gönderim, düzenleme, silme,
 * hata mesajı, giriş yapılmamışken form gizli.
 */

const { listProductReviews, upsertMyProductReview, deleteMyProductReview, oturum } = vi.hoisted(
  () => ({
    listProductReviews: vi.fn(),
    upsertMyProductReview: vi.fn(),
    deleteMyProductReview: vi.fn(),
    oturum: { isAuthenticated: true },
  }),
);

vi.mock("../services/petshopProductReviews", () => ({
  listProductReviews,
  upsertMyProductReview,
  deleteMyProductReview,
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => oturum,
}));

import PetShopProductReviewsSection from "./PetShopProductReviewsSection";

const REVIEWS = [
  {
    id: 1,
    authorId: 10,
    authorName: "Ayşe K.",
    rating: 5,
    comment: "Ürün çok kaliteli.",
    canEdit: true,
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
  },
  {
    id: 2,
    authorId: 20,
    authorName: "Mehmet Y.",
    rating: 3,
    comment: "Fena değil.",
    canEdit: false,
    createdAt: "2026-08-02T10:00:00Z",
    updatedAt: "2026-08-02T10:00:00Z",
  },
];

function emptyPage() {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: true,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  oturum.isAuthenticated = true;
  listProductReviews.mockResolvedValue({
    content: REVIEWS,
    totalElements: 2,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: false,
  });
  upsertMyProductReview.mockResolvedValue({ ...REVIEWS[0], rating: 4, comment: "Güncellendi" });
  deleteMyProductReview.mockResolvedValue(undefined);
});

describe("PetShopProductReviewsSection", () => {
  it("yorum listesini sunucudan çekip render eder", async () => {
    render(<PetShopProductReviewsSection productId={7} />);

    await waitFor(() => expect(listProductReviews).toHaveBeenCalledWith(7));
    expect(await screen.findByText("Ayşe K.")).toBeInTheDocument();
    expect(screen.getByText("Ürün çok kaliteli.")).toBeInTheDocument();
    expect(screen.getByText("Mehmet Y.")).toBeInTheDocument();
    expect(screen.getByText("Fena değil.")).toBeInTheDocument();
  });

  it("boş listede 'Henüz bir yorum yok.' gösterir", async () => {
    listProductReviews.mockResolvedValue(emptyPage());

    render(<PetShopProductReviewsSection productId={7} />);

    expect(await screen.findByText("Henüz bir yorum yok.")).toBeInTheDocument();
  });

  it("canEdit:true olan yorumda düzenle/sil görünür, diğerinde görünmez", async () => {
    render(<PetShopProductReviewsSection productId={7} />);

    await screen.findByText("Ayşe K.");

    const editButtons = screen.getAllByRole("button", { name: "Düzenle" });
    const deleteButtons = screen.getAllByRole("button", { name: "Sil" });
    expect(editButtons).toHaveLength(1);
    expect(deleteButtons).toHaveLength(1);
  });

  it("form gönderimi upsertMyProductReview'ı doğru productId/rating/comment ile çağırır ve listeyi yeniler", async () => {
    render(<PetShopProductReviewsSection productId={7} />);

    await screen.findByText("Ayşe K.");
    listProductReviews.mockClear();

    const form = screen.getByTestId("petshop-product-review-form");
    const textarea = within(form).getByPlaceholderText(/yorum/i);
    fireEvent.change(textarea, { target: { value: "Harika bir ürün" } });

    const formStars = within(form).getAllByTestId(/^star-rating-star-/);
    fireEvent.click(formStars[3]); // 4. yıldız

    fireEvent.click(within(form).getByRole("button", { name: /Gönder/ }));

    await waitFor(() =>
      expect(upsertMyProductReview).toHaveBeenCalledWith(7, {
        rating: 4,
        comment: "Harika bir ürün",
      }),
    );
    await waitFor(() => expect(listProductReviews).toHaveBeenCalledWith(7));
  });

  it("düzenleme: mevcut yorum güncellenip liste yenilenir", async () => {
    render(<PetShopProductReviewsSection productId={7} />);

    await screen.findByText("Ayşe K.");
    fireEvent.click(screen.getByRole("button", { name: "Düzenle" }));

    listProductReviews.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() => expect(upsertMyProductReview).toHaveBeenCalled());
    await waitFor(() => expect(listProductReviews).toHaveBeenCalledWith(7));
  });

  it("silme: onaylanınca deleteMyProductReview çağrılır ve liste yenilenir", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<PetShopProductReviewsSection productId={7} />);

    await screen.findByText("Ayşe K.");
    listProductReviews.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Sil" }));

    await waitFor(() => expect(deleteMyProductReview).toHaveBeenCalledWith(7));
    await waitFor(() => expect(listProductReviews).toHaveBeenCalledWith(7));
  });

  it("gönderim hatası errorMessage olarak görünür", async () => {
    upsertMyProductReview.mockRejectedValue(new Error("boom"));

    render(<PetShopProductReviewsSection productId={7} />);

    await screen.findByText("Ayşe K.");
    const form = screen.getByTestId("petshop-product-review-form");
    const formStars = within(form).getAllByTestId(/^star-rating-star-/);
    fireEvent.click(formStars[2]);

    fireEvent.click(within(form).getByRole("button", { name: /Gönder/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Yorum gönderilirken bir hata oluştu.",
    );
  });

  it("giriş yapılmamışken yorum formu render edilmez", async () => {
    oturum.isAuthenticated = false;

    render(<PetShopProductReviewsSection productId={7} />);

    await screen.findByText("Ayşe K.");
    expect(screen.queryByTestId("petshop-product-review-form")).toBeNull();
  });
});
