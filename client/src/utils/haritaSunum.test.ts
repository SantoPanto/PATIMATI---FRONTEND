import { describe, expect, it } from "vitest";
import type { AdType } from "../services/types";
import {
  getMarkerType,
  haritaOdagi,
  VARSAYILAN_MERKEZ,
} from "./haritaSunum";

/*
 * 22.08 saha geri bildirimi: "filtreye basınca haritada bir şey değişmiyor".
 * Kök sebep iki katmandı: işaretçiler tek renkti (className canlıda SVG
 * path'e ulaşmıyordu) + görünüm kalan işaretçilere odaklanmıyordu (Bursa
 * kadraj dışında kalıyordu). Bu testler renk/odak sözleşmesini kilitler.
 */
describe("getMarkerType", () => {
  it("üç ilan tipi üç AYRI dolgu rengi taşır", () => {
    const tipler: AdType[] = ["LOST", "FOUND", "ADOPTION"];
    const renkler = tipler.map((tip) => getMarkerType(tip).fillColor);

    expect(new Set(renkler).size).toBe(3);
    renkler.forEach((renk) => expect(renk).toMatch(/^#[0-9a-f]{6}$/i));
  });

  it("etiketler Türkçe", () => {
    expect(getMarkerType("LOST").label).toBe("Kayıp");
    expect(getMarkerType("FOUND").label).toBe("Bulunan");
    expect(getMarkerType("ADOPTION").label).toBe("Sahiplendirme");
  });
});

describe("haritaOdagi", () => {
  const nokta1: [number, number] = [39.93, 32.85]; // Ankara
  const nokta2: [number, number] = [40.19, 29.06]; // Bursa

  it("seçili ilan varsa ona yaklaşır", () => {
    const odak = haritaOdagi(nokta1, [nokta1, nokta2]);

    expect(odak).toEqual({ tip: "nokta", nokta: nokta1, yakinlik: 13 });
  });

  it("seçili yoksa kalan işaretçilerin TÜMÜNÜ kadraja alır", () => {
    const odak = haritaOdagi(null, [nokta1, nokta2]);

    expect(odak.tip).toBe("sinir");
    if (odak.tip === "sinir") {
      expect(odak.noktalar).toHaveLength(2);
      expect(odak.noktalar).toContain(nokta2);
    }
  });

  it("hiç işaretçi yoksa varsayılan merkeze döner", () => {
    const odak = haritaOdagi(null, []);

    expect(odak).toEqual({
      tip: "varsayilan",
      nokta: VARSAYILAN_MERKEZ,
      yakinlik: 12,
    });
  });
});
