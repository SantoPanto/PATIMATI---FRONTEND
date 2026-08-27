import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `services/shelter.ts` -- yol/metod sözleşme kilidi. `getMyShelter`/
 * `upsertMyShelter`/`getShelter`/`listShelters` `services/petshop.ts`'in
 * birebir aynısı; `listShelterAdoptions`'ın 1:1 bir emsali yok (yeni
 * backend ucu, `GET /api/shelters/{id}/adoptions`), bu yüzden ayrıca
 * doğrulanıyor (plan §B.5).
 */

const { istek } = vi.hoisted(() => ({ istek: vi.fn() }));

vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");
  return { ...actual, request: istek };
});

const { getMyShelter, upsertMyShelter, getShelter, listShelters, listShelterAdoptions } =
  await import("./shelter");
const { ApiError } = await import("./api");

beforeEach(() => {
  istek.mockReset();
});

describe("getMyShelter", () => {
  it("GET /api/shelter/card'a Bearer ile gider", async () => {
    istek.mockResolvedValue({ id: 1, name: "Barınak" });

    await getMyShelter();

    expect(istek).toHaveBeenCalledWith(
      "/api/shelter/card",
      expect.objectContaining({ method: "GET", requiresAuth: true }),
    );
  });

  it("404'te null döner", async () => {
    istek.mockRejectedValue(new ApiError("bulunamadı", 404, null));

    const sonuc = await getMyShelter();

    expect(sonuc).toBeNull();
  });

  it("404 dışındaki hatalar yeniden fırlatılır", async () => {
    istek.mockRejectedValue(new ApiError("sunucu hatası", 500, null));

    await expect(getMyShelter()).rejects.toThrow("sunucu hatası");
  });
});

describe("upsertMyShelter", () => {
  it("PUT /api/shelter/card'a multipart gövdeyle gider", async () => {
    istek.mockResolvedValue({ id: 1, name: "Barınak" });

    await upsertMyShelter({
      name: "Barınak",
      address: "Adres",
      city: "Ankara",
      phone: "0312 000 00 00",
    });

    expect(istek).toHaveBeenCalledWith(
      "/api/shelter/card",
      expect.objectContaining({
        method: "PUT",
        requiresAuth: true,
        body: expect.any(FormData),
      }),
    );
  });
});

describe("getShelter", () => {
  it("GET /api/shelters/{id}'e kimliksiz gider", async () => {
    istek.mockResolvedValue({ id: 7, name: "Barınak" });

    await getShelter(7);

    expect(istek).toHaveBeenCalledWith("/api/shelters/7", { method: "GET" });
  });

  it("404'te null döner", async () => {
    istek.mockRejectedValue(new ApiError("bulunamadı", 404, null));

    const sonuc = await getShelter(7);

    expect(sonuc).toBeNull();
  });
});

describe("listShelters", () => {
  it("GET /api/shelters'e gider, page/size/city sorgu dizesine eklenir", async () => {
    istek.mockResolvedValue({ content: [], totalElements: 0 });

    await listShelters({ page: 0, size: 20, city: "Ankara" });

    expect(istek).toHaveBeenCalledWith(
      "/api/shelters?page=0&size=20&city=Ankara",
      { method: "GET" },
    );
  });

  it("parametresiz çağrıda sorgu dizesi eklenmez", async () => {
    istek.mockResolvedValue({ content: [], totalElements: 0 });

    await listShelters();

    expect(istek).toHaveBeenCalledWith("/api/shelters", { method: "GET" });
  });
});

describe("listShelterAdoptions", () => {
  it("GET /api/shelters/{shelterId}/adoptions'a kimliksiz gider", async () => {
    istek.mockResolvedValue({ content: [], totalElements: 0 });

    await listShelterAdoptions(9);

    expect(istek).toHaveBeenCalledWith(
      "/api/shelters/9/adoptions",
      { method: "GET" },
    );
  });

  it("page/size verilirse sorgu dizesine eklenir", async () => {
    istek.mockResolvedValue({ content: [], totalElements: 0 });

    await listShelterAdoptions(9, { page: 1, size: 12 });

    expect(istek).toHaveBeenCalledWith(
      "/api/shelters/9/adoptions?page=1&size=12",
      { method: "GET" },
    );
  });
});
