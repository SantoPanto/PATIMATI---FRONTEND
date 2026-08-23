import { describe, it, expect, vi } from "vitest";
import { compressImage, compressImages } from "./imageCompression";

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
