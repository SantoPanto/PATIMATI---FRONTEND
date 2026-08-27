import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MyComplaint } from "../services/complaints";
import { ApiError } from "../services/api";

/**
 * "Şikayetlerim" ekranı (S7) — statik taslaktan gerçek listeye geçişin bekçisi.
 *
 * <p>Eski sayfa hiçbir uca bağlı değildi ve HER ZAMAN "şikayetiniz yok"
 * diyordu. Bu testler: liste doluyken üç türün de doğru etiket/durum/bağlantıyla
 * çizildiğini, boş listede eski boş-durum metninin korunduğunu ve hata
 * hâlinin sessiz kalmadığını kilitler.
 */

const { sikayetGetir } = vi.hoisted(() => ({ sikayetGetir: vi.fn() }));

vi.mock("../services/complaints", async (gercegi) => ({
  ...(await gercegi<typeof import("../services/complaints")>()),
  getMyComplaints: sikayetGetir,
}));

vi.mock("wouter", () => ({
  Link: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={href}>{children}</a>
  ),
  useLocation: () => ["/complaints", vi.fn()],
}));

import ComplaintPage from "./ComplaintPage";

function sikayet(ek: Partial<MyComplaint> = {}): MyComplaint {
  return {
    id: 1,
    tur: "ILAN",
    hedefId: 42,
    reason: "SAHTE_ILAN",
    description: "Fotoğraflar başka bir ilandan alınmış.",
    status: "BEKLEMEDE",
    createdAt: "2026-08-27T12:00:00Z",
    ...ek,
  } as MyComplaint;
}

describe("ComplaintPage — Şikayetlerim", () => {
  it("üç tür de etiketi, durumu ve ilan bağlantısıyla çizilir", async () => {
    sikayetGetir.mockResolvedValue([
      sikayet({ id: 1, tur: "ILAN", hedefId: 42, status: "BEKLEMEDE" }),
      sikayet({ id: 2, tur: "KULLANICI", hedefId: 7, status: "COZULDU" }),
      sikayet({ id: 3, tur: "SAHIPLENDIRME", hedefId: 9, status: "INCELEMEDE" }),
    ]);

    render(<ComplaintPage />);

    await waitFor(() => {
      expect(screen.getByText("İlan şikayeti")).toBeInTheDocument();
    });
    expect(screen.getByText("Kullanıcı şikayeti")).toBeInTheDocument();
    expect(screen.getByText("Sahiplendirme şikayeti")).toBeInTheDocument();

    // Durum rozetleri çeviriden geçer
    expect(screen.getByText("Beklemede")).toBeInTheDocument();
    expect(screen.getByText("Çözüldü")).toBeInTheDocument();

    // İlan/sahiplendirme hedefe bağlanır; kullanıcı şikayeti bağlantısızdır
    const linkler = screen.getAllByRole("link", { name: /ilana git/ });
    expect(linkler.map((l) => l.getAttribute("href"))).toEqual([
      "/pet/42",
      "/adoption/9",
    ]);
  });

  it("boş listede boş-durum kartı görünür, 'yükleniyor' kalkar", async () => {
    sikayetGetir.mockResolvedValue([]);

    render(<ComplaintPage />);

    await waitFor(() => {
      expect(screen.getByText("Kayıtlı şikayet bulunamadı")).toBeInTheDocument();
    });
    expect(screen.queryByText(/yükleniyor/i)).toBeNull();
  });

  it("uç hata verirse kullanıcı sessiz boş liste DEĞİL, hata mesajı görür", async () => {
    sikayetGetir.mockRejectedValue(new ApiError("Oturum süresi doldu.", 401, null));

    render(<ComplaintPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Oturum süresi doldu.");
    });
    expect(screen.queryByText("Kayıtlı şikayet bulunamadı")).toBeNull();
  });
});
