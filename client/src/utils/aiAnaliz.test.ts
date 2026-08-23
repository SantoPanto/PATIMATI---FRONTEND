import { describe, expect, it } from "vitest";
import { aiCevabiniNormallestir } from "./aiAnaliz";

/**
 * /api/ai/analyze'ın İKİ cevap şekli için normalleştirme bekçisi.
 *
 * <p>Backend PR #156 (24.08 gecesi merge) cevabı "olduğu gibi geçir"
 * sözleşmesinden `AiAnalyzeMapper`'a çevirdi: `pattern` → `coatPattern`,
 * `is_pet` → `isPet`, renkler `labels`taki `soft:color_X` yerine `colors`ta
 * enum adı. Ekranlar eski adları okuduğu için mapper'lı backend'de otomatik
 * doldurma tür+cins dışında tamamen boş kalıyordu. Bu testler iki şeklin de
 * ekran sözleşmesine indiğini kilitler.
 */
describe("aiCevabiniNormallestir", () => {
  it("eski şekli DEĞİŞTİRMEDEN geçirir (RGB colors elenir, labels korunur)", () => {
    const eski = {
      labels: ["soft:color_gray", "hard:eye_color_green", "bonus:collar_no_collar"],
      species: "cat",
      is_pet: true,
      breed: "Tekir",
      pattern: "tabby",
      colors: [{ r: 130, g: 130, b: 130, score: 0.8 }],
    };

    const sonuc = aiCevabiniNormallestir(eski);

    expect(sonuc).toEqual(eski);
  });

  it("yeni şekli (#156) eski alan adlarına çevirir", () => {
    const sonuc = aiCevabiniNormallestir({
      species: "CAT",
      breed: "Tekir",
      coatPattern: "TABBY",
      colors: ["GRAY", "WHITE"],
      isPet: true,
    });

    expect(sonuc.is_pet).toBe(true);
    expect(sonuc.pattern).toBe("TABBY");
    expect(sonuc.labels).toEqual(["soft:color_gray", "soft:color_white"]);
    // Ekranların zaten okuduğu alanlar dokunulmadan durur.
    expect(sonuc.species).toBe("CAT");
    expect(sonuc.breed).toBe("Tekir");
  });

  it("yeni şekilde isPet:false 'hayvan yok' kapısına ulaşır", () => {
    const sonuc = aiCevabiniNormallestir({ species: "UNKNOWN", isPet: false });

    expect(sonuc.is_pet).toBe(false);
  });

  it("yeni şeklin boş cevabı boş kalır (etiket uydurulmaz)", () => {
    const sonuc = aiCevabiniNormallestir({
      species: "UNKNOWN",
      breed: null,
      coatPattern: null,
      colors: [],
      isPet: true,
    });

    expect(sonuc.labels).toBeUndefined();
    // `coatPattern: null` dizgi olmadığı için `pattern` üretilmez; ekranlar
    // `analysis.pattern &&` ile baktığından undefined da null da doldurmaz.
    expect(sonuc.pattern).toBeUndefined();
    expect(sonuc.is_pet).toBe(true);
  });

  it("dolu labels varken colors'tan etiket TÜRETMEZ", () => {
    const sonuc = aiCevabiniNormallestir({
      labels: ["soft:color_black"],
      colors: ["WHITE"],
    });

    expect(sonuc.labels).toEqual(["soft:color_black"]);
  });
});
