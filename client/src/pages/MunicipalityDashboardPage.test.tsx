import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import type {
  IsiHaritasiNoktasi,
  PanelIstatistikleri,
} from "../services/panelService";
import { ApiError } from "../services/api";

/**
 * Belediye paneli — alan adlarının ve telde giden tarih biçiminin bekçisi.
 *
 * <p><b>Neden:</b> bu modülde iki taraf bir kez AYRI SÖZLÜKLE yazıldı
 * (ekran {@code resolvedCount} derken uç {@code reunionCount} diyordu) ve
 * alan kayması sessizce boş sayaç üretir — tsc yakalayamaz, çünkü cevap tipi
 * dışarıdan gelir. Tarih de {@code Z}'siz LocalDateTime gitmek zorunda:
 * {@code toISOString()} kayması sunucuda ya 400 ya SESSİZ yanlış aralıktır.
 *
 * <p>react-leaflet sahte: jsdom'da gerçek harita güvenilir render edilmiyor;
 * ölçülen şey haritanın kendisi değil, NOKTALARIN türe göre renklendirilmesi.
 */

const { istatistikGetir, haritaGetir } = vi.hoisted(() => ({
  istatistikGetir: vi.fn(),
  haritaGetir: vi.fn(),
}));

// yerelIsoTarihSaat + EN_COK_ISI_NOKTASI gerçek kalıyor; yalnız istekler sahte.
vi.mock("../services/panelService", async (gercegi) => ({
  ...(await gercegi<typeof import("../services/panelService")>()),
  getPanelIstatistikleri: istatistikGetir,
  getIsiHaritasi: haritaGetir,
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="harita">{children}</div>
  ),
  TileLayer: () => null,
  CircleMarker: (props: { fillColor?: string }) => (
    <span data-testid="yogunluk-noktasi" data-renk={props.fillColor} />
  ),
}));

import MunicipalityDashboardPage from "./MunicipalityDashboardPage";

const ISTATISTIK: PanelIstatistikleri = {
  district: "Osmangazi",
  lostCount: 12,
  foundCount: 8,
  adoptionCount: 3,
  reunionCount: 15,
};

function nokta(ek: Partial<IsiHaritasiNoktasi> = {}): IsiHaritasiNoktasi {
  return {
    latitude: 40.1885,
    longitude: 29.061,
    type: "LOST",
    createdAt: "2026-08-20T10:00:00",
    ...ek,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  istatistikGetir.mockResolvedValue(ISTATISTIK);
  haritaGetir.mockResolvedValue([]);
});

describe("MunicipalityDashboardPage", () => {
  it("reunionCount alanını okur (resolvedCount değil) ve dört sayacı basar", async () => {
    render(<MunicipalityDashboardPage />);

    const kavusanlar = await screen.findByText("Sahibine Kavuşanlar");
    expect(kavusanlar.parentElement).toHaveTextContent("15");
    expect(screen.getByText("Kayıp İlanları").parentElement).toHaveTextContent("12");
    expect(screen.getByText("Bulunan Hayvanlar").parentElement).toHaveTextContent("8");
    expect(screen.getByText("Sahiplendirme İlanları").parentElement).toHaveTextContent("3");
  });

  it("ilçeyi sunucu cevabından basar, istemci sabitinden değil", async () => {
    render(<MunicipalityDashboardPage />);

    expect(
      await screen.findByText(/Belediye Yönetim Paneli — Osmangazi/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Nilüfer/)).not.toBeInTheDocument();
  });

  it("tarihleri Z'siz LocalDateTime biçiminde, gün sınırlarıyla gönderir", async () => {
    render(<MunicipalityDashboardPage />);
    await screen.findByText(/Osmangazi/);

    const [aralik] = istatistikGetir.mock.calls[0];
    expect(aralik.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00$/);
    expect(aralik.endDate).toMatch(/^\d{4}-\d{2}-\d{2}T23:59:59$/);

    // Harita isteği aynı aralıkla ve tavan limitle gidiyor — demo verisinin
    // tamamı görünsün diye sunucu varsayılanı 500'e bırakılmıyor.
    expect(haritaGetir).toHaveBeenCalledWith(aralik, 2000);
  });

  it("tarih değişince yeni aralıkla yeniden istek atar", async () => {
    render(<MunicipalityDashboardPage />);
    await screen.findByText(/Osmangazi/);

    fireEvent.change(screen.getByLabelText("Başlangıç"), {
      target: { value: "2026-08-01" },
    });

    await waitFor(() => {
      const [aralik] = istatistikGetir.mock.calls.at(-1)!;
      expect(aralik.startDate).toBe("2026-08-01T00:00:00");
    });
  });

  it("başlangıç bitişten sonraysa uyarır ve istek ATMAZ", async () => {
    render(<MunicipalityDashboardPage />);
    await screen.findByText(/Osmangazi/);
    const oncekiCagriSayisi = istatistikGetir.mock.calls.length;

    fireEvent.change(screen.getByLabelText("Başlangıç"), {
      target: { value: "2099-01-01" },
    });

    expect(
      await screen.findByText("Başlangıç tarihi bitişten sonra olamaz."),
    ).toBeInTheDocument();
    expect(istatistikGetir.mock.calls.length).toBe(oncekiCagriSayisi);
  });

  it("yoğunluk noktalarını türe göre renklendirir", async () => {
    haritaGetir.mockResolvedValue([
      nokta({ type: "LOST" }),
      nokta({ type: "FOUND", latitude: 40.19 }),
      nokta({ type: "ADOPTION", latitude: 40.2 }),
    ]);

    render(<MunicipalityDashboardPage />);

    await waitFor(() => {
      const noktalar = screen.getAllByTestId("yogunluk-noktasi");
      expect(noktalar).toHaveLength(3);
      expect(noktalar.map((n) => n.dataset.renk)).toEqual([
        "#DC2626",
        "#2563EB",
        "#9333EA",
      ]);
    });
    expect(screen.getByText("3 nokta")).toBeInTheDocument();
  });

  it("sunucu hatasında sunucunun kendi mesajını gösterir", async () => {
    istatistikGetir.mockRejectedValue(
      new ApiError("Bu işlem için kurum yetkisi gerekiyor.", 403, null),
    );

    render(<MunicipalityDashboardPage />);

    expect(
      await screen.findByText("Bu işlem için kurum yetkisi gerekiyor."),
    ).toBeInTheDocument();
  });
});
