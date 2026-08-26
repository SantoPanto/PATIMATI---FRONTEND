import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `services/vetReviews.ts` -- yol/metod sözleşme kilidi.
 *
 * <p><b>Neden bu dosya var:</b> `vetCustomers.ts` için eş değer bir test
 * dosyası yok (plan §B.6, doğrulandı) -- bu yüzden `services/vet.ts`'in kendi
 * çağrı şekline bakılarak yazıldı: her fonksiyonun doğru metod/yola gittiğini
 * ve `getMyClinicReview`'in 404'te `null` döndüğünü (`getMyRequestStatus` ile
 * aynı sözleşme) kilitler.
 */

const { istek } = vi.hoisted(() => ({ istek: vi.fn() }));

vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");
  return { ...actual, request: istek };
});

const { listClinicReviews, getMyClinicReview, upsertMyClinicReview, deleteMyClinicReview } =
  await import("./vetReviews");
const { ApiError } = await import("./api");

beforeEach(() => {
  istek.mockReset();
});

describe("listClinicReviews", () => {
  it("GET /api/vet-clinics/{id}/reviews'a gider, kimlik gerektirmez", async () => {
    istek.mockResolvedValue({ content: [], totalElements: 0 });

    await listClinicReviews(5);

    expect(istek).toHaveBeenCalledWith(
      "/api/vet-clinics/5/reviews",
      expect.objectContaining({ method: "GET" }),
    );
    const [, options] = istek.mock.calls[0] as [string, { requiresAuth?: boolean }];
    expect(options.requiresAuth).not.toBe(true);
  });

  it("page/size verilirse sorgu dizesine eklenir", async () => {
    istek.mockResolvedValue({ content: [], totalElements: 0 });

    await listClinicReviews(5, { page: 1, size: 10 });

    expect(istek).toHaveBeenCalledWith(
      "/api/vet-clinics/5/reviews?page=1&size=10",
      expect.objectContaining({ method: "GET" }),
    );
  });
});

describe("getMyClinicReview", () => {
  it("GET /api/vet-clinics/{id}/reviews/me'ye Bearer ile gider", async () => {
    istek.mockResolvedValue({ id: 1, rating: 5 });

    await getMyClinicReview(5);

    expect(istek).toHaveBeenCalledWith(
      "/api/vet-clinics/5/reviews/me",
      expect.objectContaining({ method: "GET", requiresAuth: true }),
    );
  });

  it("404'te null döner (getMyRequestStatus ile aynı sözleşme)", async () => {
    istek.mockRejectedValue(new ApiError("bulunamadı", 404, null));

    const sonuc = await getMyClinicReview(5);

    expect(sonuc).toBeNull();
  });

  it("404 dışındaki hatalar yeniden fırlatılır", async () => {
    istek.mockRejectedValue(new ApiError("sunucu hatası", 500, null));

    await expect(getMyClinicReview(5)).rejects.toThrow("sunucu hatası");
  });
});

describe("upsertMyClinicReview", () => {
  it("PUT /api/vet-clinics/{id}/reviews/me'ye rating/comment gövdesiyle gider", async () => {
    istek.mockResolvedValue({ id: 1, rating: 4, comment: "İyi" });

    await upsertMyClinicReview(5, { rating: 4, comment: "İyi" });

    expect(istek).toHaveBeenCalledWith(
      "/api/vet-clinics/5/reviews/me",
      expect.objectContaining({
        method: "PUT",
        requiresAuth: true,
        body: JSON.stringify({ rating: 4, comment: "İyi" }),
      }),
    );
  });
});

describe("deleteMyClinicReview", () => {
  it("DELETE /api/vet-clinics/{id}/reviews/me'ye Bearer ile gider", async () => {
    istek.mockResolvedValue(undefined);

    await deleteMyClinicReview(5);

    expect(istek).toHaveBeenCalledWith(
      "/api/vet-clinics/5/reviews/me",
      expect.objectContaining({ method: "DELETE", requiresAuth: true }),
    );
  });
});
