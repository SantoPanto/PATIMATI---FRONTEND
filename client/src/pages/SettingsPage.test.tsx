import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Ayarlar &gt; Çevre uyarıları — sayfanın SUNUCUYA bağlı tek anahtarı.
 *
 * <p><b>Neden bu dosya var:</b> "Yakındaki ilanlar" anahtarı bugüne kadar
 * yalnız yerel state'ti — kapatınca hiçbir şey kapanmıyordu. Bölüm artık
 * konum tabanlı uyarı aboneliğini (GET/PUT /api/alert-subscriptions/me)
 * okuyup yazıyor; bu testler tel sözleşmesini kilitler: hangi tıklama
 * sunucuya ne gönderir, 404 ("henüz abonelik yok") nasıl ele alınır.
 */

const { abonelikGetir, abonelikKaydet, geokod } = vi.hoisted(() => ({
  abonelikGetir: vi.fn(),
  abonelikKaydet: vi.fn(),
  geokod: vi.fn(),
}));

vi.mock("../services/alerts", () => ({
  getMyAlertSubscription: abonelikGetir,
  saveAlertSubscription: abonelikKaydet,
}));

vi.mock("../utils/geokod", () => ({
  ilIlcedenKoordinat: geokod,
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/settings", vi.fn()],
}));

import SettingsPage from "./SettingsPage";

const MEVCUT = {
  latitude: 40.1928,
  longitude: 29.061,
  radiusKm: 25,
  enabled: true,
};

/** Bildirimler bölümünü açar; çevre anahtarı bölümdeki 3. switch'tir. */
async function bildirimleriAc() {
  fireEvent.click(screen.getByRole("button", { name: /Bildirimler/ }));
  await waitFor(() => {
    expect(abonelikGetir).toHaveBeenCalled();
  });
}

function cevreAnahtari() {
  const anahtarlar = screen.getAllByRole("switch");
  return anahtarlar[anahtarlar.length - 1];
}

describe("SettingsPage — çevre uyarıları", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    abonelikKaydet.mockImplementation((govde) => Promise.resolve(govde));
  });

  it("mevcut abonelik yüklenir: anahtar açık, yarıçap ve koordinatlar dolu", async () => {
    abonelikGetir.mockResolvedValue(MEVCUT);
    render(<SettingsPage />);
    await bildirimleriAc();

    await waitFor(() => {
      expect(cevreAnahtari()).toHaveAttribute("aria-checked", "true");
    });
    expect(screen.getByLabelText("Yarıçap")).toHaveValue("25");
    expect(screen.getByLabelText("Enlem")).toHaveValue("40.1928");
    expect(screen.getByLabelText("Boylam")).toHaveValue("29.061");
  });

  it("abonelik yokken (404→null) anahtar kapalıdır ve açmak sunucuya YAZMAZ", async () => {
    abonelikGetir.mockResolvedValue(null);
    render(<SettingsPage />);
    await bildirimleriAc();

    await waitFor(() => {
      expect(screen.queryByText("Ayarların yükleniyor…")).not.toBeInTheDocument();
    });
    expect(cevreAnahtari()).toHaveAttribute("aria-checked", "false");

    fireEvent.click(cevreAnahtari());

    // Konum henüz yok: kayıt ancak ilk "Kaydet"te oluşmalı.
    expect(abonelikKaydet).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Kaydet" })).toBeInTheDocument();
  });

  it("elle koordinat + Kaydet, tam gövdeyi PUT eder", async () => {
    abonelikGetir.mockResolvedValue(null);
    render(<SettingsPage />);
    await bildirimleriAc();
    await waitFor(() => {
      expect(screen.queryByText("Ayarların yükleniyor…")).not.toBeInTheDocument();
    });

    fireEvent.click(cevreAnahtari());
    fireEvent.change(screen.getByLabelText("Enlem"), {
      target: { value: "40.1928" },
    });
    fireEvent.change(screen.getByLabelText("Boylam"), {
      target: { value: "29.0610" },
    });
    fireEvent.change(screen.getByLabelText("Yarıçap"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() => {
      expect(abonelikKaydet).toHaveBeenCalledWith({
        latitude: 40.1928,
        longitude: 29.061,
        radiusKm: 5,
        enabled: true,
      });
    });
    expect(
      await screen.findByText(/Çevre uyarıları açık/),
    ).toBeInTheDocument();
  });

  it("koordinatsız Kaydet sunucuya gitmez, yol gösteren hata çıkar", async () => {
    abonelikGetir.mockResolvedValue(null);
    render(<SettingsPage />);
    await bildirimleriAc();
    await waitFor(() => {
      expect(screen.queryByText("Ayarların yükleniyor…")).not.toBeInTheDocument();
    });

    fireEvent.click(cevreAnahtari());
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(abonelikKaydet).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Önce konum seç/),
    ).toBeInTheDocument();
  });

  it("açık aboneliği kapatmak enabled:false ile PUT eder", async () => {
    abonelikGetir.mockResolvedValue(MEVCUT);
    render(<SettingsPage />);
    await bildirimleriAc();
    await waitFor(() => {
      expect(cevreAnahtari()).toHaveAttribute("aria-checked", "true");
    });

    fireEvent.click(cevreAnahtari());

    await waitFor(() => {
      expect(abonelikKaydet).toHaveBeenCalledWith({
        ...MEVCUT,
        enabled: false,
      });
    });
    expect(
      await screen.findByText("Çevre uyarıları kapatıldı."),
    ).toBeInTheDocument();
  });

  it("il/ilçeden Bul, koordinat alanlarını geokodlama sonucuyla doldurur", async () => {
    abonelikGetir.mockResolvedValue(null);
    geokod.mockResolvedValue({ latitude: 40.1928, longitude: 29.061 });
    render(<SettingsPage />);
    await bildirimleriAc();
    await waitFor(() => {
      expect(screen.queryByText("Ayarların yükleniyor…")).not.toBeInTheDocument();
    });

    fireEvent.click(cevreAnahtari());
    fireEvent.change(screen.getByLabelText("İl"), {
      target: { value: "Bursa" },
    });
    fireEvent.change(screen.getByLabelText("İlçe"), {
      target: { value: "Nilüfer" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Bul" }));

    await waitFor(() => {
      expect(geokod).toHaveBeenCalledWith("Bursa", "Nilüfer");
    });
    expect(screen.getByLabelText("Enlem")).toHaveValue("40.192800");
    expect(screen.getByLabelText("Boylam")).toHaveValue("29.061000");
  });
});
