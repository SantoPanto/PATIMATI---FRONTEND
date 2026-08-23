import { describe, expect, it } from "vitest";
import {
  translateEnum,
  translateEnumArray,
  ENUM_TRANSLATIONS,
} from "./enumTranslator";

describe("enumTranslator utility", () => {
  describe("translateEnum", () => {
    it("translates colors correctly", () => {
      expect(translateEnum("BROWN", "color")).toBe("Kahverengi");
      expect(translateEnum("GRAY", "color")).toBe("Gri");
      expect(translateEnum("BLACK", "color")).toBe("Siyah");
      expect(translateEnum("WHITE", "color")).toBe("Beyaz");
      expect(translateEnum("OTHER", "color")).toBe("Diğer");
    });

    it("translates eye colors correctly", () => {
      expect(translateEnum("BLUE", "eyeColor")).toBe("Mavi");
      expect(translateEnum("GREEN", "eyeColor")).toBe("Yeşil");
      expect(translateEnum("BROWN", "eyeColor")).toBe("Kahverengi");
      expect(translateEnum("HETEROCHROMIA", "eyeColor")).toBe(
        "Farklı Renkler (Heterokromi)"
      );
      expect(translateEnum("OTHER", "eyeColor")).toBe("Diğer");
    });

    it("translates gender and age groups correctly", () => {
      expect(translateEnum("MALE", "gender")).toBe("Erkek");
      expect(translateEnum("FEMALE", "gender")).toBe("Dişi");
      expect(translateEnum("BABY", "ageGroup")).toBe("Yavru");
      expect(translateEnum("YOUNG", "ageGroup")).toBe("Genç");
      expect(translateEnum("ADULT", "ageGroup")).toBe("Yetişkin");
      expect(translateEnum("SENIOR", "ageGroup")).toBe("Yaşlı");
    });

    it("translates status, ad types and presence status correctly", () => {
      expect(translateEnum("LOST", "adType")).toBe("Kayıp");
      expect(translateEnum("FOUND", "adType")).toBe("Bulundu");
      expect(translateEnum("ADOPTION", "adType")).toBe("Sahiplendirme");
      expect(translateEnum("YES", "presenceStatus")).toBe("Evet");
      expect(translateEnum("NO", "presenceStatus")).toBe("Hayır");
      expect(translateEnum("UNKNOWN", "presenceStatus")).toBe("Bilinmiyor");
    });

    it("translates species correctly", () => {
      expect(translateEnum("DOG", "species")).toBe("Köpek");
      expect(translateEnum("CAT", "species")).toBe("Kedi");
      expect(translateEnum("BIRD", "species")).toBe("Kuş");
      expect(translateEnum("OTHER", "species")).toBe("Diğer");
    });

    it("translates coat patterns correctly", () => {
      expect(translateEnum("SOLID", "coatPattern")).toBe("Tek Renk");
      expect(translateEnum("STRIPED", "coatPattern")).toBe("Çizgili / Tekir");
      expect(translateEnum("TORTOISESHELL", "coatPattern")).toBe(
        "Kaplumbağa Kabuğu"
      );
    });

    it("translates complaint status and reason correctly", () => {
      expect(translateEnum("BEKLEMEDE", "complaintStatus")).toBe("Beklemede");
      expect(translateEnum("COZULDU", "complaintStatus")).toBe("Çözüldü");
      expect(translateEnum("SAHTE_ILAN", "complaintReason")).toBe(
        "Sahte veya Yanıltıcı İlan"
      );
    });

    it("handles lowercase inputs and spaces gracefully", () => {
      expect(translateEnum("brown", "color")).toBe("Kahverengi");
      expect(translateEnum("  male  ", "gender")).toBe("Erkek");
    });

    it("returns safe fallback or original value for unknown/empty values", () => {
      expect(translateEnum("", "color")).toBe("Bilinmiyor");
      expect(translateEnum(null, "color")).toBe("Bilinmiyor");
      expect(translateEnum(undefined, "color", "Varsayılan")).toBe(
        "Varsayılan"
      );
      expect(translateEnum("UNKNOWN_XYZ", "color")).toBe("UNKNOWN_XYZ");
    });

    it("searches across categories when category argument is omitted", () => {
      expect(translateEnum("BROWN")).toBe("Kahverengi");
      expect(translateEnum("FEMALE")).toBe("Dişi");
      expect(translateEnum("LOST")).toBe("Kayıp");
    });
  });

  describe("translateEnumArray", () => {
    it("translates arrays of enum values and joins them with default separator", () => {
      expect(translateEnumArray(["BROWN", "GRAY"], "color")).toBe(
        "Kahverengi, Gri"
      );
      expect(
        translateEnumArray(["BLACK", "WHITE", "ORANGE"], "color")
      ).toBe("Siyah, Beyaz, Turuncu");
    });

    it("supports custom separator", () => {
      expect(
        translateEnumArray(["BROWN", "GRAY"], "color", " - ")
      ).toBe("Kahverengi - Gri");
    });

    it("filters out empty or invalid values from the array", () => {
      expect(
        translateEnumArray(["BROWN", null, "", "GRAY", undefined], "color")
      ).toBe("Kahverengi, Gri");
    });

    it("returns empty string for null/empty arrays", () => {
      expect(translateEnumArray([], "color")).toBe("");
      expect(translateEnumArray(null, "color")).toBe("");
      expect(translateEnumArray(undefined, "color")).toBe("");
    });
  });

  describe("ENUM_TRANSLATIONS dictionary completeness", () => {
    it("contains all expected categories", () => {
      expect(Object.keys(ENUM_TRANSLATIONS)).toEqual([
        "color",
        "eyeColor",
        "gender",
        "ageGroup",
        "adType",
        "presenceStatus",
        "species",
        "coatPattern",
        "complaintStatus",
        "complaintReason",
        "aiStatus",
        "adResolutionStatus",
        "role",
      ]);
    });
  });
});
