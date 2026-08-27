import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Barınak puan/yorum bölümü (plan §13, §B.3) -- `PetShopProductReviewsSection.test.tsx`/
 * `VetClinicReviewsSection.test.tsx` neyi kapsıyorsa onun aynısı: liste, boş
 * durum, gönderim, düzenleme, silme, hata mesajı, giriş yapılmamışken form
 * gizli. Barınak SEVİYESİNDE puanlama -- `shelterId` prop'u alır, ilan bazlı
 * DEĞİL.
 */

const { listShelterReviews, upsertMyShelterReview, deleteMyShelterReview, oturum } = vi.hoisted(
  () => ({
    listShelterReviews: vi.fn(),
    upsertMyShelterReview: vi.fn(),
    deleteMyShelterReview: vi.fn(),
    oturum: { isAuthenticated: true },
  }),
);

vi.mock("../services/shelterReviews", () => ({
  listShelterReviews,
  upsertMyShelterReview,
  deleteMyShelterReview,
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => oturum,
}));

import ShelterReviewsSection from "./ShelterReviewsSection";

const REVIEWS = [
  {
    id: 1,
    authorId: 10,
    authorName: "Ayşe K.",
    rating: 5,
    comment: "Barınak çok özenli.",
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
  listShelterReviews.mockResolvedValue({
    content: REVIEWS,
    totalElements: 2,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: false,
  });
  upsertMyShelterReview.mockResolvedValue({ ...REVIEWS[0], rating: 4, comment: "Güncellendi" });
  deleteMyShelterReview.mockResolvedValue(undefined);
});

describe("ShelterReviewsSection", () => {
  it("yorum listesini sunucudan çekip render eder", async () => {
    render(<ShelterReviewsSection shelterId={7} />);

    await waitFor(() => expect(listShelterReviews).toHaveBeenCalledWith(7));
    expect(await screen.findByText("Ayşe K.")).toBeInTheDocument();
    expect(screen.getByText("Barınak çok özenli.")).toBeInTheDocument();
    expect(screen.getByText("Mehmet Y.")).toBeInTheDocument();
    expect(screen.getByText("Fena değil.")).toBeInTheDocument();
  });

  it("boş listede 'Henüz bir yorum yok.' gösterir", async () => {
    listShelterReviews.mockResolvedValue(emptyPage());

    render(<ShelterReviewsSection shelterId={7} />);

    expect(await screen.findByText("Henüz bir yorum yok.")).toBeInTheDocument();
  });

  it("canEdit:true olan yorumda düzenle/sil görünür, diğerinde görünmez", async () => {
    render(<ShelterReviewsSection shelterId={7} />);

    await screen.findByText("Ayşe K.");

    const editButtons = screen.getAllByRole("button", { name: "Düzenle" });
    const deleteButtons = screen.getAllByRole("button", { name: "Sil" });
    expect(editButtons).toHaveLength(1);
    expect(deleteButtons).toHaveLength(1);
  });

  it("form gönderimi upsertMyShelterReview'ı doğru shelterId/rating/comment ile çağırır ve listeyi yeniler", async () => {
    render(<ShelterReviewsSection shelterId={7} />);

    await screen.findByText("Ayşe K.");
    listShelterReviews.mockClear();

    const form = screen.getByTestId("shelter-review-form");
    const textarea = within(form).getByPlaceholderText(/yorum/i);
    fireEvent.change(textarea, { target: { value: "Harika bir barınak" } });

    const formStars = within(form).getAllByTestId(/^star-rating-star-/);
    fireEvent.click(formStars[3]); // 4. yıldız

    fireEvent.click(within(form).getByRole("button", { name: /Gönder/ }));

    await waitFor(() =>
      expect(upsertMyShelterReview).toHaveBeenCalledWith(7, {
        rating: 4,
        comment: "Harika bir barınak",
      }),
    );
    await waitFor(() => expect(listShelterReviews).toHaveBeenCalledWith(7));
  });

  it("düzenleme: mevcut yorum güncellenip liste yenilenir", async () => {
    render(<ShelterReviewsSection shelterId={7} />);

    await screen.findByText("Ayşe K.");
    fireEvent.click(screen.getByRole("button", { name: "Düzenle" }));

    listShelterReviews.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() => expect(upsertMyShelterReview).toHaveBeenCalled());
    await waitFor(() => expect(listShelterReviews).toHaveBeenCalledWith(7));
  });

  it("silme: onaylanınca deleteMyShelterReview çağrılır ve liste yenilenir", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<ShelterReviewsSection shelterId={7} />);

    await screen.findByText("Ayşe K.");
    listShelterReviews.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Sil" }));

    await waitFor(() => expect(deleteMyShelterReview).toHaveBeenCalledWith(7));
    await waitFor(() => expect(listShelterReviews).toHaveBeenCalledWith(7));
  });

  it("gönderim hatası errorMessage olarak görünür", async () => {
    upsertMyShelterReview.mockRejectedValue(new Error("boom"));

    render(<ShelterReviewsSection shelterId={7} />);

    await screen.findByText("Ayşe K.");
    const form = screen.getByTestId("shelter-review-form");
    const formStars = within(form).getAllByTestId(/^star-rating-star-/);
    fireEvent.click(formStars[2]);

    fireEvent.click(within(form).getByRole("button", { name: /Gönder/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Yorum gönderilirken bir hata oluştu.",
    );
  });

  it("giriş yapılmamışken yorum formu render edilmez", async () => {
    oturum.isAuthenticated = false;

    render(<ShelterReviewsSection shelterId={7} />);

    await screen.findByText("Ayşe K.");
    expect(screen.queryByTestId("shelter-review-form")).toBeNull();
  });
});
