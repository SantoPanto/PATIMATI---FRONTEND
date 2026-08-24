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
});
