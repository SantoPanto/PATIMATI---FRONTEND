import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MatchCard from "./MatchCard";
import type { MatchResponseDTO } from "../services/types";
import * as messagesService from "../services/messages";
import * as adsService from "../services/ads";

vi.mock("../services/messages", () => ({
  startConversationWithAd: vi.fn(),
}));

vi.mock("../services/ads", () => ({
  getPublicAdById: vi.fn(),
}));

describe("MatchCard", () => {
  const mockMatch: MatchResponseDTO = {
    id: 1,
    myAdId: 10,
    myAdTitle: "Benim İlanım",
    partnerAdId: 20,
    partnerAdTitle: "Eşleşen Bulunan Kedi",
    partnerAd: {
      id: 20,
      title: "Eşleşen Bulunan Kedi",
      photoUrl: "https://example.com/cat.jpg",
      species: "CAT",
      breed: "Tekir",
    },
    totalScore: 0.88,
    visualScore: 0.90,
    tagScore: 0.85,
    locationScore: 0.95,
    thresholdAtTime: 0.60,
    passedThreshold: true,
  };

  it("İlanı İncele ve İlan Sahibiyle İletişime Geç butonlarını render etmeli", () => {
    render(<MatchCard match={mockMatch} />);

    expect(screen.getByText("İlanı İncele")).toBeInTheDocument();
    expect(screen.getByText("İlan Sahibiyle İletişime Geç")).toBeInTheDocument();
  });

  it("İlan Sahibiyle İletişime Geç butonuna basıldığında startConversationWithAd çağrılmalı", async () => {
    vi.spyOn(adsService, "getPublicAdById").mockResolvedValueOnce({
      id: 20,
      title: "Eşleşen Bulunan Kedi",
      ownerId: 42,
    } as any);

    vi.spyOn(messagesService, "startConversationWithAd").mockResolvedValueOnce({
      roomId: 123,
      partnerId: 42,
    });

    render(<MatchCard match={mockMatch} />);

    const contactBtn = screen.getByText("İlan Sahibiyle İletişime Geç");
    fireEvent.click(contactBtn);

    await waitFor(() => {
      expect(messagesService.startConversationWithAd).toHaveBeenCalledWith({
        targetUserId: 42,
        adId: 20,
      });
    });
  });
});
