import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `services/shelterReviews.ts` -- yol/metod sözleşme kilidi.
 * `services/vetReviews.test.ts`'in birebir aynısı, `/api/shelters` yoluna
 * (plan §B.4).
 */

const { istek } = vi.hoisted(() => ({ istek: vi.fn() }));

vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");
  return { ...actual, request: istek };
});

const {
  listShelterReviews,
  getMyShelterReview,
  upsertMyShelterReview,
  deleteMyShelterReview,
} = await import("./shelterReviews");
const { ApiError } = await import("./api");

beforeEach(() => {
  istek.mockReset();
});

describe("listShelterReviews", () => {
  it("GET /api/shelters/{id}/reviews'a gider, kimlik gerektirmez", async () => {
    istek.mockResolvedValue({ content: [], totalElements: 0 });

    await listShelterReviews(5);

    expect(istek).toHaveBeenCalledWith(
      "/api/shelters/5/reviews",
      expect.objectContaining({ method: "GET" }),
    );
    const [, options] = istek.mock.calls[0] as [string, { requiresAuth?: boolean }];
    expect(options.requiresAuth).not.toBe(true);
  });

  it("page/size verilirse sorgu dizesine eklenir", async () => {
    istek.mockResolvedValue({ content: [], totalElements: 0 });

    await listShelterReviews(5, { page: 1, size: 10 });

    expect(istek).toHaveBeenCalledWith(
      "/api/shelters/5/reviews?page=1&size=10",
      expect.objectContaining({ method: "GET" }),
    );
  });
});

describe("getMyShelterReview", () => {
  it("GET /api/shelters/{id}/reviews/me'ye Bearer ile gider", async () => {
    istek.mockResolvedValue({ id: 1, rating: 5 });

    await getMyShelterReview(5);

    expect(istek).toHaveBeenCalledWith(
      "/api/shelters/5/reviews/me",
      expect.objectContaining({ method: "GET", requiresAuth: true }),
    );
  });

  it("404'te null döner", async () => {
    istek.mockRejectedValue(new ApiError("bulunamadı", 404, null));

    const sonuc = await getMyShelterReview(5);

    expect(sonuc).toBeNull();
  });

  it("404 dışındaki hatalar yeniden fırlatılır", async () => {
    istek.mockRejectedValue(new ApiError("sunucu hatası", 500, null));

    await expect(getMyShelterReview(5)).rejects.toThrow("sunucu hatası");
  });
});

describe("upsertMyShelterReview", () => {
  it("PUT /api/shelters/{id}/reviews/me'ye rating/comment gövdesiyle gider", async () => {
    istek.mockResolvedValue({ id: 1, rating: 4, comment: "İyi" });

    await upsertMyShelterReview(5, { rating: 4, comment: "İyi" });

    expect(istek).toHaveBeenCalledWith(
      "/api/shelters/5/reviews/me",
      expect.objectContaining({
        method: "PUT",
        requiresAuth: true,
        body: JSON.stringify({ rating: 4, comment: "İyi" }),
      }),
    );
  });
});

describe("deleteMyShelterReview", () => {
  it("DELETE /api/shelters/{id}/reviews/me'ye Bearer ile gider", async () => {
    istek.mockResolvedValue(undefined);

    await deleteMyShelterReview(5);

    expect(istek).toHaveBeenCalledWith(
      "/api/shelters/5/reviews/me",
      expect.objectContaining({ method: "DELETE", requiresAuth: true }),
    );
  });
});
