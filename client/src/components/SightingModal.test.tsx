import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * "Bu hayvanı gördüm" formu — tel sözleşmesi kilidi.
 *
 * <p><b>Neden bu dosya var:</b> form girişsiz ziyaretçinin de kullandığı,
 * /api/public altındaki İLK yazma ucuna gönderiyor. Testler neyin sunucuya
 * gittiğini kilitler: koordinatsız/iletişimsiz gönderim hiç çıkmaz,
 * geçerli gönderim tam gövdeyi taşır, il/ilçe geokodlaması alanları doldurur,
 * girişli kullanıcının iletişimi önceden dolar.
 */

const { gorulmeBirak, geokod } = vi.hoisted(() => ({
  gorulmeBirak: vi.fn(),
  geokod: vi.fn(),
}));

vi.mock("../services/sightings", () => ({
  createSighting: gorulmeBirak,
}));

vi.mock("../utils/geokod", () => ({
  ilIlcedenKoordinat: geokod,
}));

import SightingModal from "./SightingModal";

function ac(ekstra: Partial<React.ComponentProps<typeof SightingModal>> = {}) {
  return render(
    <SightingModal
      isOpen
      onClose={vi.fn()}
      adId={7}
      adTitle="Boncuk kayboldu"
      {...ekstra}
    />,
  );
}

describe("SightingModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gorulmeBirak.mockResolvedValue({ id: 99 });
  });

  it("koordinatsız gönderim sunucuya çıkmaz, yol gösteren hata görünür", () => {
    ac();

    fireEvent.change(screen.getByLabelText(/İletişim/), {
      target: { value: "0555 111 22 33" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Bildirimi Gönder" }));

    expect(gorulmeBirak).not.toHaveBeenCalled();
    expect(screen.getByText(/Önce konum seçin/)).toBeInTheDocument();
  });

  it("iletişimsiz gönderim sunucuya çıkmaz — sahibi bildirene ulaşamazdı", () => {
    ac();

    fireEvent.change(screen.getByLabelText("Enlem"), {
      target: { value: "40.1928" },
    });
    fireEvent.change(screen.getByLabelText("Boylam"), {
      target: { value: "29.0610" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Bildirimi Gönder" }));

    expect(gorulmeBirak).not.toHaveBeenCalled();
    expect(screen.getByText(/İletişim bilgisi zorunlu/)).toBeInTheDocument();
  });

  it("geçerli form tam gövdeyle gönderilir ve teşekkür ekranı gelir", async () => {
    ac();

    fireEvent.change(screen.getByLabelText("Enlem"), {
      target: { value: "40.1928" },
    });
    fireEvent.change(screen.getByLabelText("Boylam"), {
      target: { value: "29.0610" },
    });
    fireEvent.change(screen.getByLabelText(/Not/), {
      target: { value: "Parkta gördüm" },
    });
    fireEvent.change(screen.getByLabelText(/İletişim/), {
      target: { value: "0555 111 22 33" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Bildirimi Gönder" }));

    await waitFor(() => {
      expect(gorulmeBirak).toHaveBeenCalledWith(
        7,
        {
          latitude: 40.1928,
          longitude: 29.061,
          note: "Parkta gördüm",
          reporterContact: "0555 111 22 33",
        },
        null,
      );
    });
    expect(
      await screen.findByText("Bildirimin ilan sahibine iletildi"),
    ).toBeInTheDocument();
  });

  it("il/ilçeden Bul koordinat alanlarını doldurur", async () => {
    geokod.mockResolvedValue({ latitude: 40.1928, longitude: 29.061 });
    ac();

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

  it("girişli kullanıcının iletişimi önceden doludur", () => {
    ac({ defaultContact: "abone@ornek.com" });

    expect(screen.getByLabelText(/İletişim/)).toHaveValue("abone@ornek.com");
  });
});
