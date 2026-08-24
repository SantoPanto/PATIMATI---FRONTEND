import { describe, expect, it } from "vitest";
import { mesafeKm } from "./mesafe";

describe("mesafeKm", () => {
  it("aynı nokta için 0 döner", () => {
    expect(mesafeKm(39.9334, 32.8597, 39.9334, 32.8597)).toBe(0);
  });

  it("bilinen çifti doğru ölçer (canlı test panosu: Ankara → 102 km kuzeyi)", () => {
    // Canlı pano ilanı #32, #26'nın 102 km kuzeyine açılmıştı (40.85 vs 39.9334,
    // aynı boylam). 0.9166 derecelik enlem farkı ≈ 101.9 km.
    const km = mesafeKm(39.9334, 32.8597, 40.85, 32.8597);
    expect(km).toBeGreaterThan(100);
    expect(km).toBeLessThan(104);
  });

  it("argüman sırasından bağımsızdır", () => {
    const ileri = mesafeKm(40.2306, 28.8419, 40.7306, 31.6);
    const geri = mesafeKm(40.7306, 31.6, 40.2306, 28.8419);
    expect(ileri).toBeCloseTo(geri, 10);
  });

  it("25 km sınırının iki yakasını ayırt eder (süzgecin kullandığı eşik)", () => {
    // 1 derece boylam ~40. enlemde ≈ 85 km; 0.25 derece ≈ 21 km (sınır içi),
    // 0.5 derece ≈ 42 km (sınır dışı).
    const icerde = mesafeKm(40.0, 29.0, 40.0, 29.25);
    const disarda = mesafeKm(40.0, 29.0, 40.0, 29.5);
    expect(icerde).toBeLessThan(25);
    expect(disarda).toBeGreaterThan(25);
  });
});
