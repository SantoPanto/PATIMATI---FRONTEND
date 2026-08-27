import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AnimalReport, SayfaliCevap } from "../services/reportService";
import { ApiError } from "../services/api";

/**
 * Belediye ihbar kuyruğu — telde ne gittiğinin ve sarmalın nasıl açıldığının
 * bekçisi.
 *
 * <p><b>Neden bu üç şey ölçülüyor:</b> uç Spring {@code Page<>} sarmalı döner —
 * sayfa {@code content}'i düz dizi sanırsa liste hep boş görünür ve tsc bunu
 * yakalayamaz (ikisi de "bir şey" render eder). Durum süzgeci SUNUCUYA gitmeli —
 * istemcide süzülürse yalnız o sayfa süzülür ve sayaçlar yalan söyler. Durum
 * geçişi de doğru id + doğru hedef durumla gitmeli; yanlış geçiş kuyruğu
 * karıştırır.
 */

const { kuyrukGetir, durumGuncelle } = vi.hoisted(() => ({
  kuyrukGetir: vi.fn(),
  durumGuncelle: vi.fn(),
}));

// Tipler ve ApiError GERÇEK kalıyor; yalnız istek atan iki fonksiyon sahte.
vi.mock("../services/reportService", async (gercegi) => ({
  ...(await gercegi<typeof import("../services/reportService")>()),
  getMunicipalityReports: kuyrukGetir,
  updateReportStatus: durumGuncelle,
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="modal-harita">{children}</div>
  ),
  TileLayer: () => null,
  CircleMarker: () => <span data-testid="modal-nokta" />,
}));

import MunicipalityReportQueuePage from "./MunicipalityReportQueuePage";

function ihbar(ek: Partial<AnimalReport> = {}): AnimalReport {
  return {
    id: 1,
    reporterContact: "0555 111 22 33",
    type: "YARALI",
    note: "Bacağı yaralı bir kedi",
    photoUrl: null,
    latitude: 40.1885,
    longitude: 29.061,
    city: "Bursa",
    district: "Nilüfer",
    status: "YENI",
    createdAt: "2026-08-26T14:30:00",
    ...ek,
  };
}

function sayfaCevabi(
  kayitlar: AnimalReport[],
  ek: Partial<SayfaliCevap<AnimalReport>> = {},
): SayfaliCevap<AnimalReport> {
  return {
    content: kayitlar,
    totalElements: kayitlar.length,
    totalPages: 1,
    number: 0,
    size: 20,
    ...ek,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MunicipalityReportQueuePage", () => {
  it("Page<> sarmalının content alanını okur ve kayıtları listeler", async () => {
    kuyrukGetir.mockResolvedValue(
      sayfaCevabi([
        ihbar(),
        ihbar({ id: 2, type: "SAHIPSIZ", note: "Sürü hâlinde", status: "ISLEME_ALINDI" }),
      ]),
    );

    render(<MunicipalityReportQueuePage />);

    expect(await screen.findByText("Bacağı yaralı bir kedi")).toBeInTheDocument();
    expect(screen.getByText("Sürü hâlinde")).toBeInTheDocument();
    expect(screen.getByText("Yaralı hayvan")).toBeInTheDocument();
    expect(screen.getByText("Sahipsiz hayvan")).toBeInTheDocument();
    expect(kuyrukGetir).toHaveBeenCalledWith({
      status: undefined,
      page: 0,
      size: 20,
    });
  });

  it("durum süzgeci SUNUCUYA gider, istemcide süzülmez", async () => {
    kuyrukGetir.mockResolvedValue(sayfaCevabi([ihbar()]));

    render(<MunicipalityReportQueuePage />);
    await screen.findByText("Bacağı yaralı bir kedi");

    await userEvent.selectOptions(
      screen.getByLabelText("Duruma Göre Filtrele"),
      "YENI",
    );

    await waitFor(() =>
      expect(kuyrukGetir).toHaveBeenLastCalledWith({
        status: "YENI",
        page: 0,
        size: 20,
      }),
    );
  });

  it("İşleme al düğmesi doğru id ve hedef durumla PATCH atar, sonra listeyi tazeler", async () => {
    kuyrukGetir.mockResolvedValue(sayfaCevabi([ihbar({ id: 7 })]));
    durumGuncelle.mockResolvedValue(ihbar({ id: 7, status: "ISLEME_ALINDI" }));

    render(<MunicipalityReportQueuePage />);
    await userEvent.click(
      await screen.findByRole("button", { name: "İşleme al" }),
    );

    expect(durumGuncelle).toHaveBeenCalledWith(7, "ISLEME_ALINDI");
    // Yerinde düzeltme değil yeniden çekme: aktif süzgeçte durumu değişen
    // kayıt listeden düşmeli. İlk yükleme + tazeleme = en az 2 çağrı.
    await waitFor(() => expect(kuyrukGetir.mock.calls.length).toBeGreaterThan(1));
  });

  it("işleme alınmış kayıtta sonraki adım Tamamlandı, tamamlanmışta düğme yok", async () => {
    kuyrukGetir.mockResolvedValue(
      sayfaCevabi([
        ihbar({ id: 1, status: "ISLEME_ALINDI" }),
        ihbar({ id: 2, status: "TAMAMLANDI", note: "Barınağa alındı" }),
      ]),
    );

    render(<MunicipalityReportQueuePage />);
    await screen.findByText("Barınağa alındı");

    expect(
      screen.getByRole("button", { name: "Tamamlandı işaretle" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "İşleme al" }),
    ).not.toBeInTheDocument();
  });

  it("sunucu hatasında sunucunun kendi mesajını gösterir", async () => {
    kuyrukGetir.mockRejectedValue(
      new ApiError("Bu işlem için kurum yetkisi gerekiyor.", 403, null),
    );

    render(<MunicipalityReportQueuePage />);

    expect(
      await screen.findByText("Bu işlem için kurum yetkisi gerekiyor."),
    ).toBeInTheDocument();
  });

  it("boş kuyrukta boş durum metni görünür", async () => {
    kuyrukGetir.mockResolvedValue(sayfaCevabi([]));

    render(<MunicipalityReportQueuePage />);

    expect(await screen.findByText("Kuyrukta ihbar yok.")).toBeInTheDocument();
  });

  it("sayfalama Sonraki ile bir sonraki sayfayı sunucudan ister", async () => {
    kuyrukGetir.mockResolvedValue(
      sayfaCevabi([ihbar()], { totalElements: 45, totalPages: 3 }),
    );

    render(<MunicipalityReportQueuePage />);
    await screen.findByText("Sayfa 1 / 3");

    await userEvent.click(screen.getByRole("button", { name: "Sonraki" }));

    await waitFor(() =>
      expect(kuyrukGetir).toHaveBeenLastCalledWith({
        status: undefined,
        page: 1,
        size: 20,
      }),
    );
  });

  it("Haritada gör, ihbarın konum modalını açar ve Kapat kapatır (S6)", async () => {
    kuyrukGetir.mockResolvedValue(sayfaCevabi([ihbar({ id: 7, district: "Nilüfer" })]));

    render(<MunicipalityReportQueuePage />);

    const dugme = await screen.findByRole("button", { name: /Haritada gör/ });
    await userEvent.click(dugme);

    const modal = screen.getByRole("dialog", { name: /İhbar #7 konumu/ });
    expect(modal).toBeInTheDocument();
    expect(screen.getByTestId("modal-harita")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Kapat" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Fotoğrafı aç bağlantısı getImageUrl ile medya domain URL'sine yönlendirir", async () => {
    kuyrukGetir.mockResolvedValue(
      sayfaCevabi([ihbar({ id: 1, photoUrl: "reports/2026/08/28/test.jpg" })]),
    );

    render(<MunicipalityReportQueuePage />);

    const link = await screen.findByRole("link", { name: "Fotoğrafı aç" });
    expect(link).toHaveAttribute(
      "href",
      "https://media.patimati.me/reports/2026/08/28/test.jpg",
    );
    expect(link).toHaveAttribute("target", "_blank");
  });
});
