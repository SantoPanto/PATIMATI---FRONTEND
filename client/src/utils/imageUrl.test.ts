import { describe, expect, it } from "vitest";
import { getImageUrl } from "./imageUrl";

describe("getImageUrl", () => {
  it("relative ads path için https://media.patimati.me URL'si üretir", () => {
    expect(getImageUrl("ads/2026/08/test.jpg")).toBe(
      "https://media.patimati.me/ads/2026/08/test.jpg",
    );
  });

  it("başında slash (/) olan relative path'i düzgün temizleyip medya URL'sine çevirir", () => {
    expect(getImageUrl("/ads/2026/08/test.jpg")).toBe(
      "https://media.patimati.me/ads/2026/08/test.jpg",
    );
  });

  it("hali hazırda mutlak (absolute) https URL'yi olduğu gibi korur", () => {
    expect(getImageUrl("https://media.patimati.me/ads/2026/08/test.jpg")).toBe(
      "https://media.patimati.me/ads/2026/08/test.jpg",
    );
  });

  it("başında kazara slash olan mutlak URL'deki baştaki slash'leri temizler", () => {
    expect(
      getImageUrl("/https://media.patimati.me/ads/2026/08/test.jpg"),
    ).toBe("https://media.patimati.me/ads/2026/08/test.jpg");
  });

  it("boş veya geçersiz değerlerde fallback görselini döner", () => {
    expect(getImageUrl(null)).toBe("/favicon.svg");
    expect(getImageUrl(undefined)).toBe("/favicon.svg");
    expect(getImageUrl("")).toBe("/favicon.svg");
    expect(getImageUrl("   ")).toBe("/favicon.svg");
  });
});
