import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BenNeyimPage from "./BenNeyimPage";
import * as petAnaliziService from "../services/petAnalizi";
import * as compressionUtils from "../utils/imageCompression";
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

describe("BenNeyimPage", () => {
  it("breed: null olan başarılı AI yanıtını hata yerine başarı kartıyla gösterir", async () => {
    const mockSuccessResponse: AiAnalysis = {
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

    vi.spyOn(petAnaliziService, "petRaporuAl").mockResolvedValue(mockSuccessResponse);
    vi.spyOn(compressionUtils, "compressImagesWithinLimit").mockImplementation(async (files) => ({
      accepted: files,
      stillTooLarge: [],
    }));

    render(<BenNeyimPage />);

    // Select file
    const file = new File(["dummy content"], "cat.jpg", { type: "image/jpeg" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for submit button to be visible
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Analiz Et/i })).toBeInTheDocument();
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Analiz Et/i }));

    // Verify success UI with breed: null
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Analiz Özeti/i })).toBeInTheDocument();
      expect(screen.getAllByText(/Melez/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Fotoğraf analiz edilemedi/i)).toBeNull();
    });
  });
});
