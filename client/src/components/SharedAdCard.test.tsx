import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SharedAdCard from "./SharedAdCard";
import type { AdResponse } from "../services/types";
import * as adsService from "../services/ads";

vi.mock("../services/ads", () => ({
  getPublicAdById: vi.fn(),
}));

describe("SharedAdCard", () => {
  const mockAd: AdResponse = {
    id: 100,
    title: "Kayıp Tekir Kedi",
    description: "Bahçede kayboldu",
    adType: "LOST",
    species: "CAT",
    breed: "Tekir",
    colors: ["GRAY"],
    gender: "MALE",
    ageGroup: "YOUNG",
    coatPattern: "STRIPED",
    collarStatus: "YES",
    earTagStatus: "NO",
    earNotchStatus: "NO",
    microchipped: false,
    photoUrls: ["https://example.com/cat.jpg"],
    latitude: 40.19,
    longitude: 29.06,
    ownerId: 5,
    ownerDisplayName: "Ahmet Yılmaz",
    active: true,
    suspended: false,
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
    city: "Bursa",
    district: "Nilüfer",
  };

  it("gönderilen ilan prop'u ile başlık, tür ve konum bilgilerini doğru render etmeli", () => {
    render(<SharedAdCard sharedAdId={100} sharedAd={mockAd} isMine={false} />);

    expect(screen.getByText("Kayıp Tekir Kedi")).toBeInTheDocument();
    expect(screen.getByText(/Kayıp • Kedi • Tekir/i)).toBeInTheDocument();
    expect(screen.getByText("Nilüfer / Bursa")).toBeInTheDocument();
    expect(screen.getByText("İlanı Gör")).toBeInTheDocument();
  });

  it("sharedAd prop'u verilmediğinde API'den ilanı çekip göstermeli", async () => {
    vi.spyOn(adsService, "getPublicAdById").mockResolvedValueOnce(mockAd);

    render(<SharedAdCard sharedAdId={100} isMine={true} />);

    expect(await screen.findByText("Kayıp Tekir Kedi")).toBeInTheDocument();
    expect(screen.getByText("Nilüfer / Bursa")).toBeInTheDocument();
  });

  it("ilan bulunamadığında veya deaktif olduğunda fallback mesajı gösterilmeli", async () => {
    vi.spyOn(adsService, "getPublicAdById").mockRejectedValueOnce(new Error("404 Not Found"));

    render(<SharedAdCard sharedAdId={999} isMine={false} />);

    expect(await screen.findByText("İlan artık aktif değil")).toBeInTheDocument();
  });
});
