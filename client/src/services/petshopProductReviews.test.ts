import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `services/petshopProductReviews.ts` -- yol/metod sözleşme kilidi.
 * `services/vetReviews.test.ts`'in birebir aynısı, `/api/petshop-products`
 * yoluna (plan §B.1).
 */

const { istek } = vi.hoisted(() => ({ istek: vi.fn() }));

vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");
  return { ...actual, request: istek };
});

const { listProductReviews, getMyProductReview, upsertMyProductReview, deleteMyProductReview } =
  await import("./petshopProductReviews");
const { ApiError } = await import("./api");

beforeEach(() => {
  istek.mockReset();
});

describe("listProductReviews", () => {
  it("GET /api/petshop-products/{id}/reviews'a gider, kimlik gerektirmez", async () => {
    istek.mockResolvedValue({ content: [], totalElements: 0 });

    await listProductReviews(5);

    expect(istek).toHaveBeenCalledWith(
      "/api/petshop-products/5/reviews",
      expect.objectContaining({ method: "GET" }),
    );
    const [, options] = istek.mock.calls[0] as [string, { requiresAuth?: boolean }];
    expect(options.requiresAuth).not.toBe(true);
  });

  it("page/size verilirse sorgu dizesine eklenir", async () => {
    istek.mockResolvedValue({ content: [], totalElements: 0 });

    await listProductReviews(5, { page: 1, size: 10 });

    expect(istek).toHaveBeenCalledWith(
      "/api/petshop-products/5/reviews?page=1&size=10",
      expect.objectContaining({ method: "GET" }),
    );
  });
});

describe("getMyProductReview", () => {
  it("GET /api/petshop-products/{id}/reviews/me'ye Bearer ile gider", async () => {
    istek.mockResolvedValue({ id: 1, rating: 5 });

    await getMyProductReview(5);

    expect(istek).toHaveBeenCalledWith(
      "/api/petshop-products/5/reviews/me",
      expect.objectContaining({ method: "GET", requiresAuth: true }),
    );
  });

  it("404'te null döner", async () => {
    istek.mockRejectedValue(new ApiError("bulunamadı", 404, null));

    const sonuc = await getMyProductReview(5);

    expect(sonuc).toBeNull();
  });

  it("404 dışındaki hatalar yeniden fırlatılır", async () => {
    istek.mockRejectedValue(new ApiError("sunucu hatası", 500, null));

    await expect(getMyProductReview(5)).rejects.toThrow("sunucu hatası");
  });
});

describe("upsertMyProductReview", () => {
  it("PUT /api/petshop-products/{id}/reviews/me'ye rating/comment gövdesiyle gider", async () => {
    istek.mockResolvedValue({ id: 1, rating: 4, comment: "İyi" });

    await upsertMyProductReview(5, { rating: 4, comment: "İyi" });

    expect(istek).toHaveBeenCalledWith(
      "/api/petshop-products/5/reviews/me",
      expect.objectContaining({
        method: "PUT",
        requiresAuth: true,
        body: JSON.stringify({ rating: 4, comment: "İyi" }),
      }),
    );
  });
});

describe("deleteMyProductReview", () => {
  it("DELETE /api/petshop-products/{id}/reviews/me'ye Bearer ile gider", async () => {
    istek.mockResolvedValue(undefined);

    await deleteMyProductReview(5);

    expect(istek).toHaveBeenCalledWith(
      "/api/petshop-products/5/reviews/me",
      expect.objectContaining({ method: "DELETE", requiresAuth: true }),
    );
  });
});
