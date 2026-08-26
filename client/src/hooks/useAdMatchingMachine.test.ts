import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAdMatchingMachine } from "./useAdMatchingMachine";
import type { MatchResponseDTO } from "../services/types";

const { mockGetMyMatches } = vi.hoisted(() => ({
  mockGetMyMatches: vi.fn(),
}));

vi.mock("../services/api", () => ({
  getMyMatches: () => mockGetMyMatches(),
}));

vi.mock("../services/notifications", () => ({
  subscribeToNotifications: vi.fn(() => () => {}),
}));

describe("useAdMatchingMachine", () => {
  beforeEach(() => {
    mockGetMyMatches.mockReset();
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it("bașlangıç durumu IDLE olmalı", () => {
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
