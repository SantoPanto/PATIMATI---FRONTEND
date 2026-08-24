import { describe, it, expect, vi } from "vitest";
import imageCompression from "browser-image-compression";
import {
  compressImage,
  compressImages,
  compressImagesWithinLimit,
} from "./imageCompression";

// Mock browser-image-compression
vi.mock("browser-image-compression", () => {
  return {
    default: vi.fn(async (_file: File, options?: any) => {
      // Return a dummy blob representing compressed image
      const type = options?.fileType || "image/jpeg";
      return new Blob(["compressed-content"], { type });
    }),
  };
});

describe("imageCompression utility", () => {
  it("compresses an image file and returns a JPEG File object by default", async () => {
    const originalPng = new File(["dummy content"], "dog.png", { type: "image/png" });
    const compressed = await compressImage(originalPng);

    expect(compressed).toBeInstanceOf(File);
    expect(compressed.name).toBe("dog.jpg");
    expect(compressed.type).toBe("image/jpeg");
  });

  it("converts webp original files to .jpg extension and image/jpeg type", async () => {
    const originalWebp = new File(["dummy content"], "cat.webp", { type: "image/webp" });
    const compressed = await compressImage(originalWebp);

    expect(compressed.name).toBe("cat.jpg");
    expect(compressed.type).toBe("image/jpeg");
  });

  it("preserves non-image files without attempting compression", async () => {
    const textFile = new File(["hello"], "doc.txt", { type: "text/plain" });
    const result = await compressImage(textFile);

    expect(result).toBe(textFile);
  });

  it("compresses multiple images in parallel using compressImages", async () => {
    const files = [
      new File(["img1"], "cat.png", { type: "image/png" }),
      new File(["img2"], "pet.jpeg", { type: "image/jpeg" }),
    ];

    const results = await compressImages(files);
    expect(results).toHaveLength(2);
    expect(results[0].type).toBe("image/jpeg");
    expect(results[0].name).toBe("cat.jpg");
    expect(results[1].type).toBe("image/jpeg");
    expect(results[1].name).toBe("pet.jpeg");
  });
});

/**
 * SIKISTIRMA SONRASI OLCUM — sahada 413'e yol acan sessiz gerileme yolu.
 *
 * <p>`compressImage` bilincli olarak "sikistirma basarisiz olursa ORIJINAL
 * dosyayi dondur" diyor (bozuk dosya, worker engellenmis, bellek yetmemis).
 * Cagiran sayfalarda boyut kontrolu sikistirmadan ONCE yapildigi icin, bu
 * yedek yola dusen buyuk dosya hicbir kontrole takilmadan sunucuya gidiyor
 * ve kullanici 413 aliyordu. Canli olcum (23.08): 6 MB tek dosya -> 413.
 */
describe("compressImagesWithinLimit", () => {
  const SINIR = 5 * 1024 * 1024;

  it("sıkıştırma BAŞARISIZ olup orijinal dosya geri gelirse sınırı aşan dosya elenir", async () => {
    // Üretimdeki gerçek yedek yol: kütüphane patlar, orijinal dosya döner.
    vi.mocked(imageCompression).mockRejectedValueOnce(
      new Error("worker kullanılamıyor"),
    );

    const buyuk = new File([new Uint8Array(6 * 1024 * 1024)], "kopek.jpg", {
      type: "image/jpeg",
    });

    const { accepted, stillTooLarge } = await compressImagesWithinLimit(
      [buyuk],
      SINIR,
    );

    expect(accepted).toHaveLength(0);
    expect(stillTooLarge).toEqual([
      { name: "kopek.jpg", size: 6 * 1024 * 1024 },
    ]);
  });

  it("sınırın altında kalan dosyalar kabul edilir", async () => {
    const kucuk = new File(["küçük"], "kedi.jpg", { type: "image/jpeg" });

    const { accepted, stillTooLarge } = await compressImagesWithinLimit(
      [kucuk],
      SINIR,
    );

    expect(stillTooLarge).toHaveLength(0);
    expect(accepted).toHaveLength(1);
    expect(accepted[0].name).toBe("kedi.jpg");
  });

  it("aynı seçimdeki büyük ve küçük dosyaları AYIRIR (biri diğerini düşürmez)", async () => {
    vi.mocked(imageCompression).mockRejectedValueOnce(
      new Error("worker kullanılamıyor"),
    );

    const buyuk = new File([new Uint8Array(6 * 1024 * 1024)], "buyuk.jpg", {
      type: "image/jpeg",
    });
    const kucuk = new File(["ufak"], "ufak.jpg", { type: "image/jpeg" });

    const { accepted, stillTooLarge } = await compressImagesWithinLimit(
      [buyuk, kucuk],
      SINIR,
    );

    expect(stillTooLarge.map((d) => d.name)).toEqual(["buyuk.jpg"]);
    expect(accepted.map((d) => d.name)).toEqual(["ufak.jpg"]);
  });
});
