import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BenNeyimPage from "./BenNeyimPage";
import * as petAnaliziService from "../services/petAnalizi";
import * as compressionUtils from "../utils/imageCompression";
import { ApiError } from "../services/api";
import type { PetReportResult } from "../services/types";

/**
 * "Ben Neyim?" -- /analyze_pet geçişinin (BE #185 + AI #33/#37) bekçisi.
 *
 * <p>Sayfa artık PetReportResult çizer (ortak PetReportView üzerinden):
 * gecerli=true'da kimlik başlığı + zengin bölümler, gecerli=false'ta
 * hata_nedeni'nin Türkçe karşılığı. Eski AiAnalysis şekline geri kayarsa
 * bu testler düşer.
 */

// Mock Header and Footer
vi.mock("../components/Header", () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock("../components/Footer", () => ({
  default: () => <footer data-testid="mock-footer">Footer</footer>,
}));

// Mock URL.createObjectURL
if (typeof window.URL.createObjectURL !== "function") {
  window.URL.createObjectURL = vi.fn(() => "blob:mock-image-url");
}

describe("BenNeyimPage — LLM pet raporu akışı", () => {
  const setupAndUpload = async () => {
    vi.spyOn(compressionUtils, "compressImagesWithinLimit").mockImplementation(
      async (files) => ({
        accepted: files,
        stillTooLarge: [],
      }),
    );

    render(<BenNeyimPage />);

    const file = new File(["dummy content"], "pet.jpg", { type: "image/jpeg" });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Analiz Et/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Analiz Et/i }));
  };

  it("gecerli raporda kimlik başlığı ve zengin bölümler gösterilir", async () => {
    const rapor: PetReportResult = {
      gecerli: true,
      tur: "Köpek",
      irk: "Golden Retriever",
      desen: "solid",
      karakter_profili:
        "Golden Retriever'lar sabırlı ve insana düşkün köpeklerdir.",
      sasirtici_bilgiler: ["Golden'ların yüzme perdeleri vardır."],
      bakim_ipuclari: { beslenme: "Günde iki öğün yeterlidir." },
      tahmini_yas: { aralik: "2-4 yaş", yasam_evresi: "Yetişkin", guven: 80 },
    };

    vi.spyOn(petAnaliziService, "petRaporuAl").mockResolvedValue(rapor);

    await setupAndUpload();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Analiz Özeti/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Köpek — Golden Retriever/i)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /Karakter Profili/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/sabırlı ve insana düşkün/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/yüzme perdeleri vardır/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Günde iki öğün yeterlidir/i)).toBeInTheDocument();
    });
  });

  it("irk BELIRLENEMEDI ise başlıkta Melez / Irk Belirlenemedi yazar", async () => {
    const rapor: PetReportResult = {
      gecerli: true,
      tur: "Kedi",
      irk: "BELIRLENEMEDI",
      desen: "tabby",
      karakter_profili: "Tekir desenli kediler meraklıdır.",
    };

    vi.spyOn(petAnaliziService, "petRaporuAl").mockResolvedValue(rapor);

    await setupAndUpload();

    await waitFor(() => {
      expect(
        screen.getByText(/Kedi — Melez \/ Irk Belirlenemedi/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/BELIRLENEMEDI/)).toBeNull();
    });
  });

  it("gecerli=false raporda hata_nedeni Türkçe mesaja çevrilir", async () => {
    const rapor: PetReportResult = {
      gecerli: false,
      hata_nedeni: "GORUNTU_COK_BULANIK",
    };

    vi.spyOn(petAnaliziService, "petRaporuAl").mockResolvedValue(rapor);

    await setupAndUpload();

    await waitFor(() => {
      expect(
        screen.getByText(/analiz için çok bulanık/i),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: /Analiz Özeti/i }),
      ).toBeNull();
    });
  });

  it("kedi/köpek değilse KEDI_KOPEK_DEGIL mesajı gösterilir", async () => {
    const rapor: PetReportResult = {
      gecerli: false,
      hata_nedeni: "KEDI_KOPEK_DEGIL",
    };

    vi.spyOn(petAnaliziService, "petRaporuAl").mockResolvedValue(rapor);

    await setupAndUpload();

    await waitFor(() => {
      expect(
        screen.getByText(/yalnızca kedi ve köpekler için/i),
      ).toBeInTheDocument();
    });
  });

  it("API hatasında kullanıcı mesajı gösterilir, rapor çizilmez", async () => {
    vi.spyOn(petAnaliziService, "petRaporuAl").mockRejectedValue(
      new ApiError("Sunucu hatası oluştu.", 500, null),
    );

    await setupAndUpload();

    await waitFor(() => {
      expect(screen.getByText(/Sunucu hatası oluştu/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: /Analiz Özeti/i }),
      ).toBeNull();
    });
  });

  it("429'da sunucunun limit mesajı olduğu gibi gösterilir", async () => {
    vi.spyOn(petAnaliziService, "petRaporuAl").mockRejectedValue(
      new ApiError(
        "Günlük analiz hakkınız doldu. Yarın tekrar deneyebilirsiniz.",
        429,
        null,
      ),
    );

    await setupAndUpload();

    await waitFor(() => {
      expect(
        screen.getByText(/Günlük analiz hakkınız doldu/i),
      ).toBeInTheDocument();
    });
  });
});
