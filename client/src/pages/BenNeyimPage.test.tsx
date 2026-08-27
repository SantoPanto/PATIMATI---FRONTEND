import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BenNeyimPage from "./BenNeyimPage";
import * as petAnaliziService from "../services/petAnalizi";
import * as compressionUtils from "../utils/imageCompression";
import { ApiError } from "../services/api";
import type { AiAnalysis } from "../services/types";

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

describe("BenNeyimPage AI Analiz Akışı", () => {
  const setupAndUpload = async () => {
    vi.spyOn(compressionUtils, "compressImagesWithinLimit").mockImplementation(async (files) => ({
      accepted: files,
      stillTooLarge: [],
    }));

    render(<BenNeyimPage />);

    const file = new File(["dummy content"], "pet.jpg", { type: "image/jpeg" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Analiz Et/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Analiz Et/i }));
  };

  it("Case 1 — Normal kedi yanıtında tür ve ırk ekranda gösterilir", async () => {
    const mockResponse: AiAnalysis = {
      species: "cat",
      species_confidence: 0.98,
      is_pet: true,
      breed: "tekir",
      breed_confidence: 0.9,
      pattern: "tabby",
    };

    vi.spyOn(petAnaliziService, "petRaporuAl").mockResolvedValue(mockResponse);

    await setupAndUpload();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Analiz Özeti/i })).toBeInTheDocument();
      expect(screen.getAllByText(/Tekir/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Fotoğraf analiz edilemedi/i)).toBeNull();
    });
  });

  it("Case 2 — Breed null yanıtında hata gösterilmez, Melez / Irk Belirlenemedi gösterilir", async () => {
    const mockResponse: AiAnalysis = {
      embedding: new Array(768).fill(0.0123),
      labels: ["soft:color_gray"],
      species: "cat",
      species_confidence: 0.9898,
      is_pet: true,
      breed: null,
      breed_confidence: 0.3344,
      pattern: "tabby",
      colors: ["gray", "white"],
      model_version: "siglip2-animal/v2",
      is_designed_graphic: false,
      graphic_confidence: 0.9994,
    };

    vi.spyOn(petAnaliziService, "petRaporuAl").mockResolvedValue(mockResponse);

    await setupAndUpload();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Analiz Özeti/i })).toBeInTheDocument();
      expect(screen.getAllByText(/Melez/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Fotoğraf analiz edilemedi/i)).toBeNull();
    });
  });

  it("Case 3 — Pattern null yanıtında analiz başarılıdır", async () => {
    const mockResponse: AiAnalysis = {
      species: "cat",
      species_confidence: 0.98,
      is_pet: true,
      breed: null,
      pattern: null,
    };

    vi.spyOn(petAnaliziService, "petRaporuAl").mockResolvedValue(mockResponse);

    await setupAndUpload();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Analiz Özeti/i })).toBeInTheDocument();
      expect(screen.queryByText(/Fotoğraf analiz edilemedi/i)).toBeNull();
    });
  });

  it("Case 4 — Pet olmadığında uyarı kartı gösterilir", async () => {
    const mockResponse: AiAnalysis = {
      species: "cat",
      species_confidence: 0.2,
      is_pet: false,
    };

    vi.spyOn(petAnaliziService, "petRaporuAl").mockResolvedValue(mockResponse);

    await setupAndUpload();

    await waitFor(() => {
      expect(screen.getByText(/evcil hayvan \(kedi veya köpek\) tespit edilemedi/i)).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: /Analiz Özeti/i })).toBeNull();
    });
  });

  it("Case 5 — Gerçek API hatasında doğru kullanıcı mesajı gösterilir", async () => {
    vi.spyOn(petAnaliziService, "petRaporuAl").mockRejectedValue(
      new ApiError("Sunucu hatası oluştu.", 500)
    );

    await setupAndUpload();

    await waitFor(() => {
      expect(screen.getByText(/Sunucu hatası oluştu/i)).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: /Analiz Özeti/i })).toBeNull();
    });
  });

  it("Case 6 — En üst AI analiz bölümü yeni veri modelini (NormalizedAiAnalysis) kullanır, legacy gecerli alanına bağımlı değildir", async () => {
    // Response strictly without legacy gecerli property
    const rawAiResponse: AiAnalysis = {
      species: "dog",
      species_confidence: 0.95,
      is_pet: true,
      breed: "Golden Retriever",
      breed_confidence: 0.91,
      colors: ["GOLDEN"],
      model_version: "siglip2-animal/v2",
    };

    vi.spyOn(petAnaliziService, "petRaporuAl").mockResolvedValue(rawAiResponse);

    await setupAndUpload();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Analiz Özeti/i })).toBeInTheDocument();
      expect(screen.getAllByText(/Köpek/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Golden Retriever/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/siglip2-animal\/v2/i)).toBeInTheDocument();
    });
  });
});
