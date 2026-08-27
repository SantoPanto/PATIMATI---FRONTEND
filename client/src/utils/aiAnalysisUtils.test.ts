import { describe, expect, it } from "vitest";
import { parseAiAnalysis } from "./aiAnalysisUtils";
import type { AiAnalysis } from "../services/types";

describe("parseAiAnalysis", () => {
  it("gerçek AI analyze response'unu doğru normalize ve parse eder", () => {
    const mockResponse: AiAnalysis = {
      species: "CAT",
      speciesConfidence: 0.9959,
      breed: "Abyssinian",
      breedConfidence: 0.7148,
      coatPattern: "UNKNOWN",
      colors: ["GRAY", "BROWN"],
      isPet: true,
    };

    const result = parseAiAnalysis(mockResponse);

    expect(result.isPet).toBe(true);
    expect(result.species).toBe("CAT");
    expect(result.breed).toBe("Abyssinian");
    expect(result.coatPattern).toBe("UNKNOWN");
    expect(result.colors).toEqual(["GRAY", "BROWN"]);
    expect(result.appliedCount).toBe(3); // species + breed + colors
  });

  it("küçük harfli enum değerlerini doğru normalize eder", () => {
    const mockResponse: AiAnalysis = {
      species: "cat",
      breed: "Tekir",
      coatPattern: "striped",
      colors: ["gray", "brown"],
      is_pet: true,
    };

    const result = parseAiAnalysis(mockResponse);

    expect(result.isPet).toBe(true);
    expect(result.species).toBe("CAT");
    expect(result.breed).toBe("Tekir");
    expect(result.coatPattern).toBe("STRIPED");
    expect(result.colors).toEqual(["GRAY", "BROWN"]);
    expect(result.appliedCount).toBe(4); // species + breed + coatPattern + colors
  });

  it("eski labels yapısını da geriye dönük destekler", () => {
    const mockResponse: AiAnalysis = {
      labels: ["soft:color_white", "hard:eye_color_blue"],
      species: "dog",
      breed: "Poodle",
      pattern: "solid",
      is_pet: true,
    };

    const result = parseAiAnalysis(mockResponse);

    expect(result.isPet).toBe(true);
    expect(result.species).toBe("DOG");
    expect(result.breed).toBe("Poodle");
    expect(result.coatPattern).toBe("SOLID");
    expect(result.colors).toEqual(["WHITE"]);
    expect(result.eyeColor).toBe("BLUE");
  });

  it("AI hayvan tespit edemediğinde isPet false döner", () => {
    const mockResponse: AiAnalysis = {
      species: "unknown",
      breed: null,
      colors: [],
      isPet: false,
    };

    const result = parseAiAnalysis(mockResponse);

    expect(result.isPet).toBe(false);
    expect(result.species).toBeNull();
    expect(result.breed).toBeNull();
    expect(result.appliedCount).toBe(0);
  });

  it("species mevcut, breed null, pattern mevcut, colors mevcut, is_pet true, embedding dolu olan cevabı başarılı kabul eder", () => {
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

    const result = parseAiAnalysis(mockResponse);

    expect(result.isPet).toBe(true);
    expect(result.species).toBe("CAT");
    expect(result.breed).toBeNull();
    expect(result.coatPattern).toBe("STRIPED");
    expect(result.colors).toEqual(["GRAY", "WHITE"]);
    expect(result.speciesConfidence).toBe(0.9898);
    expect(result.breedConfidence).toBe(0.3344);
    expect(result.modelVersion).toBe("siglip2-animal/v2");
  });

  it("pattern null ve breed null olduğunda analiz başarılıdır ve hata oluşturmaz", () => {
    const mockResponse: AiAnalysis = {
      species: "cat",
      species_confidence: 0.98,
      is_pet: true,
      breed: null,
      pattern: null,
    };

    const result = parseAiAnalysis(mockResponse);

    expect(result.isPet).toBe(true);
    expect(result.species).toBe("CAT");
    expect(result.breed).toBeNull();
    expect(result.coatPattern).toBe("UNKNOWN");
  });

  it("breed eşik altında null iken breedTop iki anahtar adından da okunur (AI #38)", () => {
    const hamSekil = parseAiAnalysis({
      species: "dog",
      species_confidence: 0.99,
      is_pet: true,
      breed: null,
      breed_top: "Kangal",
      breed_confidence: 0.63,
    });
    expect(hamSekil.breed).toBeNull();
    expect(hamSekil.breedTop).toBe("Kangal");

    const mapliSekil = parseAiAnalysis({
      species: "DOG",
      isPet: true,
      breed: null,
      breedTop: "Kangal",
      breedConfidence: 0.63,
    });
    expect(mapliSekil.breedTop).toBe("Kangal");
  });

  it("breedTop 'unknown' ya da boşsa null'a indirgenir", () => {
    expect(
      parseAiAnalysis({ species: "dog", is_pet: true, breed_top: "unknown" })
        .breedTop,
    ).toBeNull();
    expect(
      parseAiAnalysis({ species: "dog", is_pet: true, breed_top: "  " })
        .breedTop,
    ).toBeNull();
  });
});
