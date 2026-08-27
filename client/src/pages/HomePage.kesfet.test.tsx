import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * Ana sayfa "Bunları da keşfet" vitrini (S8, 27.08) — dört özellik kartının
 * doğru hedeflere bağlandığının bekçisi.
 *
 * <p>Neden: özellikler (Ben Neyim, belediye ihbarı, hizmetler, harita)
 * uygulamada vardı ama ana sayfadan görünmüyordu — kullanıcı isteği
 * "özellikler ana sayfada belirgin olsun". Kart hedef yolu kayarsa özellik
 * yine görünmez olur; bu test yolları kilitler.
 */

vi.mock("../components/Header", () => ({
  default: () => <header data-testid="mock-header" />,
}));
vi.mock("../components/Footer", () => ({
  default: () => <footer data-testid="mock-footer" />,
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, isAuthenticated: false }),
}));

vi.mock("../services/auth", () => ({
  startGoogleOAuth: vi.fn(),
}));

vi.mock("../services/ads", () => ({
  getPublicAds: vi.fn().mockResolvedValue({ content: [] }),
  getPublicAdCounters: vi
    .fn()
    .mockResolvedValue({ activeCount: 0, reunionCount: 0 }),
}));

vi.mock("../utils/konum", () => ({
  konumAl: vi.fn().mockRejectedValue(new Error("test ortamında konum yok")),
  konumHataMesaji: () => "Konum alınamadı",
}));

import HomePage from "./HomePage";

describe("HomePage — keşfet vitrini", () => {
  it("dört özellik kartı doğru hedeflere bağlanır", async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(
        screen.getByText("PATIMATI yalnız ilanlardan ibaret değil"),
      ).toBeInTheDocument();
    });

    // Kartın erişilebilir adı tüm içeriği (başlık+açıklama+bağlantı) kapsar;
    // hero'daki "İhbar et"/"Haritada ara" ile çakışmasın diye karta özgü
    // açıklama parçalarıyla seçiyoruz.
    const hedefler: Array<[RegExp, string]> = [
      [/karakter profili/, "/ben-neyim"],
      [/ilçenin belediyesine/, "/report"],
      [/puanlarıyla keşfet/, "/hizmetler"],
      [/harita üzerinde gör/, "/map"],
    ];

    for (const [ad, yol] of hedefler) {
      const kart = screen.getByRole("link", { name: ad });
      expect(kart.getAttribute("href")).toBe(yol);
    }
  });
});
