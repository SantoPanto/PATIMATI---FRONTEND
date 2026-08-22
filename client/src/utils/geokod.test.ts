import { afterEach, describe, expect, it, vi } from "vitest";
import { ilIlcedenKoordinat } from "./geokod";

/*
 * İl/ilçeden yaklaşık koordinat (22.08 saha şikayetinin kök çözümü).
 * Sözleşme: başarıda {latitude, longitude}; HER başarısızlıkta null —
 * asla fırlatmaz (ilan gönderimi geokod yüzünden kesilemez).
 */
describe("ilIlcedenKoordinat", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ilçe + il + Türkiye sorgusuyla koordinat döner", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ lat: "40.2110", lon: "28.9945" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const sonuc = await ilIlcedenKoordinat("Bursa", "Nilüfer");

    expect(sonuc).toEqual({ latitude: 40.211, longitude: 28.9945 });
    const istekUrl = String(fetchMock.mock.calls[0][0]);
    expect(istekUrl).toContain(
      encodeURIComponent("Nilüfer, Bursa, Türkiye"),
    );
  });

  it("sonuç listesi boşsa null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
    );

    expect(await ilIlcedenKoordinat("Bursa", "Nilüfer")).toBeNull();
  });

  it("HTTP hatasında null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );

    expect(await ilIlcedenKoordinat("Bursa", null)).toBeNull();
  });

  it("ağ hatasında fırlatmaz, null döner", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    await expect(
      ilIlcedenKoordinat("Bursa", "Nilüfer"),
    ).resolves.toBeNull();
  });

  it("şehir boşsa istek hiç atılmaz", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await ilIlcedenKoordinat("", "Nilüfer")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
