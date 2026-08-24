import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Mobil alt gezinme cubugunun CALISMA ANI davranisi.
 *
 * <p><b>Neden bu dosya var:</b> 22.08 canli olcumu — 1023px altinda
 * .desktop-navigation gizleniyor ve GORUNUR menu linki 0 kaliyordu; mobil
 * kullanici sayfalar arasinda gezemiyordu. Cubugun sekme isaretlemesi
 * (aria-current) ve auth ekranlarinda cizilmemesi kosullu mantik — tsc
 * hangi rotada hangi dalin calistigini goremez.
 *
 * <p><b>"/" tuzagi:</b> aktiflik startsWith ile bakilsaydi "/" HER rotayla
 * eslesir, Ana Sayfa hep aktif gorunurdu — ikinci vaka bunu olcuyor.
 */

const durum = vi.hoisted(() => ({ konum: "/" }));

vi.mock("wouter", () => ({
  useLocation: () => [durum.konum, vi.fn()] as const,
  Link: ({
    href,
    children,
    className,
    "aria-current": ariaCurrent,
  }: {
    href: string;
    children?: ReactNode;
    className?: string;
    "aria-current"?: "page";
  }) => (
    <a href={href} className={className} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
}));

import BottomNav from "./BottomNav";

function sekmeninAriaCurrent(etiket: string): string | null {
  const link = screen.getByText(etiket).closest("a");
  return link ? link.getAttribute("aria-current") : "LINK YOK";
}

beforeEach(() => {
  durum.konum = "/";
  document.body.classList.remove("has-bottom-nav");
});

describe("BottomNav", () => {
  it("/listings rotasında 5 sekme çizer, yalnız İlanlar işaretli", () => {
    durum.konum = "/listings";

    render(<BottomNav />);

    expect(screen.getAllByRole("link")).toHaveLength(5);
    expect(sekmeninAriaCurrent("İlanlar")).toBe("page");
    expect(sekmeninAriaCurrent("Ana Sayfa")).toBeNull();
    expect(sekmeninAriaCurrent("Harita")).toBeNull();
    expect(sekmeninAriaCurrent("Sahiplendirme")).toBeNull();
    expect(sekmeninAriaCurrent("Mesajlar")).toBeNull();
  });

  it("sohbet detayında da Mesajlar işaretli (startsWith: /chat/5)", () => {
    // 22.08 mobil taraması: Mesajlar'a menüden hiç erişim yoktu (tek yol
    // Profil→Mesajlarım kartı). Bu vaka sekmenin varlığını VE detay
    // rotasında da işaretli kaldığını kilitler.
    durum.konum = "/chat/5";

    render(<BottomNav />);

    expect(sekmeninAriaCurrent("Mesajlar")).toBe("page");
    expect(sekmeninAriaCurrent("Ana Sayfa")).toBeNull();
  });

  it('kök rotada yalnız Ana Sayfa işaretli ("/" her rotayla eşleşmez)', () => {
    durum.konum = "/";

    render(<BottomNav />);

    expect(sekmeninAriaCurrent("Ana Sayfa")).toBe("page");
    expect(sekmeninAriaCurrent("İlanlar")).toBeNull();
  });

  it("auth ekranında çizilmez ve gövdeye pay sınıfı eklemez", () => {
    durum.konum = "/login";

    render(<BottomNav />);

    expect(
      screen.queryByRole("navigation", { name: "Mobil gezinme" }),
    ).not.toBeInTheDocument();
    expect(document.body.classList.contains("has-bottom-nav")).toBe(false);
  });

  it("çizildiğinde gövdeye pay sınıfı ekler, kalkınca söker", () => {
    durum.konum = "/listings";

    const { unmount } = render(<BottomNav />);
    expect(document.body.classList.contains("has-bottom-nav")).toBe(true);

    unmount();
    expect(document.body.classList.contains("has-bottom-nav")).toBe(false);
  });
});
