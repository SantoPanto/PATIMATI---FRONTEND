import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Petshop (dükkan seviyesi) puan/yorum bölümü -- `ShelterReviewsSection.test.tsx`
 * neyi kapsıyorsa onun aynısı: liste, boş durum, gönderim, düzenleme, silme,
 * hata mesajı, giriş yapılmamışken form gizli. `petShopId` prop'u alır, ürün
 * bazlı yorumlarla (`PetShopProductReviewsSection`) KARIŞTIRILMAMALI.
 */

const { listPetShopReviews, upsertMyPetShopReview, deleteMyPetShopReview, oturum } = vi.hoisted(
  () => ({
    listPetShopReviews: vi.fn(),
    upsertMyPetShopReview: vi.fn(),
    deleteMyPetShopReview: vi.fn(),
    oturum: { isAuthenticated: true },
  }),
);

vi.mock("../services/petshopReviews", () => ({
  listPetShopReviews,
  upsertMyPetShopReview,
  deleteMyPetShopReview,
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => oturum,
}));

import PetShopReviewsSection from "./PetShopReviewsSection";

const REVIEWS = [
  {
    id: 1,
    authorId: 10,
    authorName: "Ayşe K.",
    rating: 5,
    comment: "Dükkan çok özenli.",
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
  listPetShopReviews.mockResolvedValue({
    content: REVIEWS,
    totalElements: 2,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: false,
  });
  upsertMyPetShopReview.mockResolvedValue({ ...REVIEWS[0], rating: 4, comment: "Güncellendi" });
  deleteMyPetShopReview.mockResolvedValue(undefined);
});

describe("PetShopReviewsSection", () => {
  it("yorum listesini sunucudan çekip render eder", async () => {
    render(<PetShopReviewsSection petShopId={7} />);

    await waitFor(() => expect(listPetShopReviews).toHaveBeenCalledWith(7));
    expect(await screen.findByText("Ayşe K.")).toBeInTheDocument();
    expect(screen.getByText("Dükkan çok özenli.")).toBeInTheDocument();
    expect(screen.getByText("Mehmet Y.")).toBeInTheDocument();
    expect(screen.getByText("Fena değil.")).toBeInTheDocument();
  });

  it("boş listede 'Henüz bir yorum yok.' gösterir", async () => {
    listPetShopReviews.mockResolvedValue(emptyPage());

    render(<PetShopReviewsSection petShopId={7} />);

    expect(await screen.findByText("Henüz bir yorum yok.")).toBeInTheDocument();
  });

  it("canEdit:true olan yorumda düzenle/sil görünür, diğerinde görünmez", async () => {
    render(<PetShopReviewsSection petShopId={7} />);

    await screen.findByText("Ayşe K.");

    const editButtons = screen.getAllByRole("button", { name: "Düzenle" });
    const deleteButtons = screen.getAllByRole("button", { name: "Sil" });
    expect(editButtons).toHaveLength(1);
    expect(deleteButtons).toHaveLength(1);
  });

  it("form gönderimi upsertMyPetShopReview'ı doğru petShopId/rating/comment ile çağırır ve listeyi yeniler", async () => {
    render(<PetShopReviewsSection petShopId={7} />);

    await screen.findByText("Ayşe K.");
    listPetShopReviews.mockClear();

    const form = screen.getByTestId("petshop-review-form");
    const textarea = within(form).getByPlaceholderText(/yorum/i);
    fireEvent.change(textarea, { target: { value: "Harika bir dükkan" } });

    const formStars = within(form).getAllByTestId(/^star-rating-star-/);
    fireEvent.click(formStars[3]); // 4. yıldız

    fireEvent.click(within(form).getByRole("button", { name: /Gönder/ }));

    await waitFor(() =>
      expect(upsertMyPetShopReview).toHaveBeenCalledWith(7, {
        rating: 4,
        comment: "Harika bir dükkan",
      }),
    );
    await waitFor(() => expect(listPetShopReviews).toHaveBeenCalledWith(7));
  });

  it("düzenleme: mevcut yorum güncellenip liste yenilenir", async () => {
    render(<PetShopReviewsSection petShopId={7} />);

    await screen.findByText("Ayşe K.");
    fireEvent.click(screen.getByRole("button", { name: "Düzenle" }));

    listPetShopReviews.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() => expect(upsertMyPetShopReview).toHaveBeenCalled());
    await waitFor(() => expect(listPetShopReviews).toHaveBeenCalledWith(7));
  });

  it("silme: onaylanınca deleteMyPetShopReview çağrılır ve liste yenilenir", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<PetShopReviewsSection petShopId={7} />);

    await screen.findByText("Ayşe K.");
    listPetShopReviews.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Sil" }));

    await waitFor(() => expect(deleteMyPetShopReview).toHaveBeenCalledWith(7));
    await waitFor(() => expect(listPetShopReviews).toHaveBeenCalledWith(7));
  });

  it("gönderim hatası errorMessage olarak görünür", async () => {
    upsertMyPetShopReview.mockRejectedValue(new Error("boom"));

    render(<PetShopReviewsSection petShopId={7} />);

    await screen.findByText("Ayşe K.");
    const form = screen.getByTestId("petshop-review-form");
    const formStars = within(form).getAllByTestId(/^star-rating-star-/);
    fireEvent.click(formStars[2]);

    fireEvent.click(within(form).getByRole("button", { name: /Gönder/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Yorum gönderilirken bir hata oluştu.",
    );
  });

  it("giriş yapılmamışken yorum formu render edilmez", async () => {
    oturum.isAuthenticated = false;

    render(<PetShopReviewsSection petShopId={7} />);

    await screen.findByText("Ayşe K.");
    expect(screen.queryByTestId("petshop-review-form")).toBeNull();
  });
});
