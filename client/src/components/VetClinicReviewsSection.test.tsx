import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Klinik puan/yorum bölümü (plan §12, §14) -- liste + "yazar başına tek
 * yorum, upsert" formu. `PetNotesSection`ın "liste + satır-içi form" ruhunu
 * taşır ama ayrı bileşen: yıldız girişi ve upsert semantiği farklı.
 */

const { listClinicReviews, upsertMyClinicReview, deleteMyClinicReview, oturum } = vi.hoisted(
  () => ({
    listClinicReviews: vi.fn(),
    upsertMyClinicReview: vi.fn(),
    deleteMyClinicReview: vi.fn(),
    oturum: { isAuthenticated: true },
  }),
);

vi.mock("../services/vetReviews", () => ({
  listClinicReviews,
  upsertMyClinicReview,
  deleteMyClinicReview,
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => oturum,
}));

import VetClinicReviewsSection from "./VetClinicReviewsSection";

const REVIEWS = [
  {
    id: 1,
    authorId: 10,
    authorName: "Ayşe K.",
    rating: 5,
    comment: "Çok ilgililerdi.",
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

beforeEach(() => {
  vi.clearAllMocks();
  oturum.isAuthenticated = true;
  listClinicReviews.mockResolvedValue({
    content: REVIEWS,
    totalElements: 2,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: false,
  });
  upsertMyClinicReview.mockResolvedValue({ ...REVIEWS[0], rating: 4, comment: "Güncellendi" });
  deleteMyClinicReview.mockResolvedValue(undefined);
});

describe("VetClinicReviewsSection", () => {
  it("yorum listesini sunucudan çekip render eder", async () => {
    render(<VetClinicReviewsSection clinicId={7} />);

    await waitFor(() => expect(listClinicReviews).toHaveBeenCalledWith(7));
    expect(await screen.findByText("Ayşe K.")).toBeInTheDocument();
    expect(screen.getByText("Çok ilgililerdi.")).toBeInTheDocument();
    expect(screen.getByText("Mehmet Y.")).toBeInTheDocument();
    expect(screen.getByText("Fena değil.")).toBeInTheDocument();
  });

  it("canEdit:true olan yorumda düzenle/sil görünür, diğerinde görünmez", async () => {
    render(<VetClinicReviewsSection clinicId={7} />);

    await screen.findByText("Ayşe K.");

    const editButtons = screen.getAllByRole("button", { name: "Düzenle" });
    const deleteButtons = screen.getAllByRole("button", { name: "Sil" });
    expect(editButtons).toHaveLength(1);
    expect(deleteButtons).toHaveLength(1);
  });

  it("form gönderimi upsertMyClinicReview'ı doğru clinicId/rating/comment ile çağırır ve listeyi yeniler", async () => {
    render(<VetClinicReviewsSection clinicId={7} />);

    await screen.findByText("Ayşe K.");
    listClinicReviews.mockClear();

    const form = screen.getByTestId("vet-clinic-review-form");
    const textarea = within(form).getByPlaceholderText(/yorum/i);
    fireEvent.change(textarea, { target: { value: "Harika bir deneyimdi" } });

    const formStars = within(form).getAllByTestId(/^star-rating-star-/);
    fireEvent.click(formStars[3]); // 4. yıldız

    fireEvent.click(within(form).getByRole("button", { name: /Gönder/ }));

    await waitFor(() =>
      expect(upsertMyClinicReview).toHaveBeenCalledWith(7, {
        rating: 4,
        comment: "Harika bir deneyimdi",
      }),
    );
    await waitFor(() => expect(listClinicReviews).toHaveBeenCalledWith(7));
  });
});
