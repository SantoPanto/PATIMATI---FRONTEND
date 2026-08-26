import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isQualifyingMatch, useAdMatchingMachine } from "./useAdMatchingMachine";
import type { MatchResponseDTO } from "../services/types";

const { mockGetMyMatches, mockGetAdById } = vi.hoisted(() => ({
  mockGetMyMatches: vi.fn(),
  mockGetAdById: vi.fn(),
}));

vi.mock("../services/api", () => ({
  getMyMatches: () => mockGetMyMatches(),
}));

vi.mock("../services/ads", () => ({
  getAdById: (id: number) => mockGetAdById(id),
}));

vi.mock("../services/notifications", () => ({
  subscribeToNotifications: vi.fn(() => () => {}),
  getNotificationSnapshot: vi.fn(() => []),
}));

describe("isQualifyingMatch boundary checks", () => {
  it("0.749 (74.9%) threshold altında olduğu için false dönmeli", () => {
    const match: MatchResponseDTO = {
      totalScore: 0.749,
      visualScore: 0.7,
      tagScore: 0.8,
      locationScore: 0.7,
      thresholdAtTime: 0.75,
      passedThreshold: false,
    };
    expect(isQualifyingMatch(match)).toBe(false);
  });

  it("0.750 (75.0%) threshold tam sınırında olduğu için true dönmeli", () => {
    const match: MatchResponseDTO = {
      totalScore: 0.75,
      visualScore: 0.75,
      tagScore: 0.75,
      locationScore: 0.75,
      thresholdAtTime: 0.75,
      passedThreshold: true,
    };
    expect(isQualifyingMatch(match)).toBe(true);
  });

  it("0.751 (75.1%) threshold üzerinde olduğu için true dönmeli", () => {
    const match: MatchResponseDTO = {
      totalScore: 0.751,
      visualScore: 0.76,
      tagScore: 0.75,
      locationScore: 0.74,
      thresholdAtTime: 0.75,
      passedThreshold: true,
    };
    expect(isQualifyingMatch(match)).toBe(true);
  });

  it("blockReason içeren adaylar threshold üstünde olsa bile false dönmeli", () => {
    const match: MatchResponseDTO = {
      totalScore: 0.9,
      visualScore: 0.9,
      tagScore: 0.9,
      locationScore: 0.9,
      thresholdAtTime: 0.75,
      passedThreshold: true,
      blockReason: "BLOCKED_BY_USER",
    };
    expect(isQualifyingMatch(match)).toBe(false);
  });
});

describe("useAdMatchingMachine", () => {
  beforeEach(() => {
    mockGetMyMatches.mockReset();
    mockGetAdById.mockReset();
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it("başlangıç durumu IDLE olmalı", () => {
    const { result } = renderHook(() => useAdMatchingMachine());
    expect(result.current.state).toBe("IDLE");
    expect(result.current.adId).toBeNull();
    expect(result.current.matches).toEqual([]);
  });

  it("startAdCreation çağrıldığında state CREATING_AD olmalı", () => {
    const { result } = renderHook(() => useAdMatchingMachine());

    act(() => {
      result.current.startAdCreation();
    });

    expect(result.current.state).toBe("CREATING_AD");
  });

  it("onAdCreated çağrıldığında SEARCHING durumuna geçmeli ve sessionStorage set etmeli", async () => {
    mockGetMyMatches.mockResolvedValue([]);
    mockGetAdById.mockResolvedValue({ id: 42, aiStatus: "PENDING" });

    const { result } = renderHook(() => useAdMatchingMachine());

    act(() => {
      result.current.onAdCreated(42);
    });

    expect(result.current.state).toBe("SEARCHING");
    expect(result.current.adId).toBe(42);
    expect(sessionStorage.getItem("pendingMatchingAdId")).toBe("42");
  });

  it("eşleşme bulunduğunda state MATCH_FOUND olmalı", async () => {
    const mockMatch: MatchResponseDTO = {
      id: 101,
      myAdId: 42,
      partnerAdId: 99,
      totalScore: 85,
      visualScore: 80,
      tagScore: 90,
      locationScore: 85,
      thresholdAtTime: 70,
      passedThreshold: true,
    };

    mockGetMyMatches.mockResolvedValue([mockMatch]);

    const { result } = renderHook(() => useAdMatchingMachine());

    act(() => {
      result.current.onAdCreated(42);
    });

    await waitFor(() => {
      expect(result.current.state).toBe("MATCH_FOUND");
    });

    expect(result.current.matches).toHaveLength(1);
    expect(result.current.matches[0].id).toBe(101);
  });

  it("karışık skorlu adaylar (0.90, 0.70, 0.55) geldiğinde yalnızca threshold'u geçen 0.90 adayı gösterilmeli", async () => {
    const matches: MatchResponseDTO[] = [
      { id: 1, myAdId: 42, totalScore: 0.9, visualScore: 0.9, tagScore: 0.9, locationScore: 0.9, thresholdAtTime: 0.75, passedThreshold: true },
      { id: 2, myAdId: 42, totalScore: 0.7, visualScore: 0.7, tagScore: 0.7, locationScore: 0.7, thresholdAtTime: 0.75, passedThreshold: false },
      { id: 3, myAdId: 42, totalScore: 0.55, visualScore: 0.55, tagScore: 0.55, locationScore: 0.55, thresholdAtTime: 0.75, passedThreshold: false },
    ];

    mockGetMyMatches.mockResolvedValue(matches);

    const { result } = renderHook(() => useAdMatchingMachine());

    act(() => {
      result.current.onAdCreated(42);
    });

    await waitFor(() => {
      expect(result.current.state).toBe("MATCH_FOUND");
    });

    expect(result.current.matches).toHaveLength(1);
    expect(result.current.matches[0].id).toBe(1);
  });

  it("tüm adaylar threshold altında ise (0.70, 0.60, 0.40) state NO_MATCH olmalı", async () => {
    const matches: MatchResponseDTO[] = [
      { id: 1, myAdId: 42, totalScore: 0.7, visualScore: 0.7, tagScore: 0.7, locationScore: 0.7, thresholdAtTime: 0.75, passedThreshold: false },
      { id: 2, myAdId: 42, totalScore: 0.6, visualScore: 0.6, tagScore: 0.6, locationScore: 0.6, thresholdAtTime: 0.75, passedThreshold: false },
      { id: 3, myAdId: 42, totalScore: 0.4, visualScore: 0.4, tagScore: 0.4, locationScore: 0.4, thresholdAtTime: 0.75, passedThreshold: false },
    ];

    mockGetMyMatches.mockResolvedValue(matches);
    mockGetAdById.mockResolvedValue({ id: 42, aiStatus: "DONE" });

    const { result } = renderHook(() => useAdMatchingMachine());

    act(() => {
      result.current.onAdCreated(42);
    });

    await waitFor(() => {
      expect(result.current.state).toBe("NO_MATCH");
    });

    expect(result.current.matches).toEqual([]);
  });

  it("AI durumu DONE olduğunda ancak eşleşme yoksa NO_MATCH olmalı", async () => {
    mockGetMyMatches.mockResolvedValue([]);
    mockGetAdById.mockResolvedValue({ id: 42, aiStatus: "DONE" });

    const { result } = renderHook(() => useAdMatchingMachine());

    act(() => {
      result.current.onAdCreated(42);
    });

    await waitFor(() => {
      expect(result.current.state).toBe("NO_MATCH");
    });
  });

  it("AI durumu FAILED olduğunda SEARCH_FAILED olmalı", async () => {
    mockGetMyMatches.mockResolvedValue([]);
    mockGetAdById.mockResolvedValue({ id: 42, aiStatus: "FAILED" });

    const { result } = renderHook(() => useAdMatchingMachine());

    act(() => {
      result.current.onAdCreated(42);
    });

    await waitFor(() => {
      expect(result.current.state).toBe("SEARCH_FAILED");
    });
  });

  it("hata alındığında state SEARCH_FAILED olmalı", async () => {
    mockGetMyMatches.mockRejectedValue(new Error("Network Error"));

    const { result } = renderHook(() => useAdMatchingMachine());

    act(() => {
      result.current.onAdCreated(42);
    });

    await waitFor(() => {
      expect(result.current.state).toBe("SEARCH_FAILED");
    });

    expect(result.current.errorMessage).toContain("Network Error");
  });

  it("mount anında sessionStorage'da bekleyen adId varsa SEARCHING durumunda durum kontrolü yapmalı", async () => {
    sessionStorage.setItem("pendingMatchingAdId", "42");
    sessionStorage.setItem("pendingMatchingAdTimestamp", String(Date.now()));

    const mockMatch: MatchResponseDTO = {
      id: 101,
      myAdId: 42,
      partnerAdId: 99,
      totalScore: 85,
      visualScore: 80,
      tagScore: 90,
      locationScore: 85,
      thresholdAtTime: 70,
      passedThreshold: true,
    };
    mockGetMyMatches.mockResolvedValue([mockMatch]);

    const { result } = renderHook(() => useAdMatchingMachine());

    await waitFor(() => {
      expect(result.current.state).toBe("MATCH_FOUND");
    });
  });

  it("reset çağrıldığında IDLE durumuna dönmeli ve sessionStorage temizlenmeli", () => {
    sessionStorage.setItem("pendingMatchingAdId", "42");

    const { result } = renderHook(() => useAdMatchingMachine());

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toBe("IDLE");
    expect(sessionStorage.getItem("pendingMatchingAdId")).toBeNull();
  });
});
