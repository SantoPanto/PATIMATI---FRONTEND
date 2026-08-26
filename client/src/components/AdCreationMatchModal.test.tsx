import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdCreationMatchModal from "./AdCreationMatchModal";
import type { MatchResponseDTO } from "../services/types";

vi.mock("wouter", () => ({
  useLocation: () => ["/add-listing", vi.fn()],
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("AdCreationMatchModal", () => {
  it("IDLE veya CREATING_AD durumunda render etmemeli", () => {
    const { container: c1 } = render(
      <AdCreationMatchModal
        state="IDLE"
        matches={[]}
        onClose={vi.fn()}
      />,
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <AdCreationMatchModal
        state="CREATING_AD"
        matches={[]}
        onClose={vi.fn()}
      />,
    );
    expect(c2.firstChild).toBeNull();
  });

  it("SEARCHING durumunda 'Veri tabanında arama yapılıyor' mesajını ve yükleme animasyonunu göstermeli", () => {
    render(
      <AdCreationMatchModal
        state="SEARCHING"
        matches={[]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Veri tabanında arama yapılıyor")).toBeInTheDocument();
    expect(
      screen.getByText("İlanınız başarıyla oluşturuldu. Şimdi uygun eşleşmeleri kontrol ediyoruz."),
    ).toBeInTheDocument();
  });

  it("MATCH_FOUND durumunda eşleşme kartlarını ve butonları göstermeli", () => {
    const mockMatches: MatchResponseDTO[] = [
      {
        id: 201,
        myAdId: 10,
        partnerAdId: 99,
        partnerAd: {
          id: 99,
          title: "Kayıp Beyaz Kedi",
          species: "CAT",
          breed: "Van Kedisi",
        },
        totalScore: 92,
        visualScore: 90,
        tagScore: 95,
        locationScore: 90,
        thresholdAtTime: 70,
        passedThreshold: true,
      },
    ];

    render(
      <AdCreationMatchModal
        state="MATCH_FOUND"
        matches={mockMatches}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Olası Eşleşme Bulundu!")).toBeInTheDocument();
    expect(screen.getByText("Kayıp Beyaz Kedi")).toBeInTheDocument();
    expect(screen.getByText("Tüm Eşleşmelerime Git")).toBeInTheDocument();
  });

  it("NO_MATCH durumunda 'İlanınız Yayınlandı' ve 'Şu anda uygun bir eşleşme bulunamadı' mesajını göstermeli", () => {
    render(
      <AdCreationMatchModal
        state="NO_MATCH"
        matches={[]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("İlanınız Yayınlandı")).toBeInTheDocument();
    expect(
      screen.getByText(/Şu anda uygun bir eşleşme bulunamadı/i),
    ).toBeInTheDocument();
  });

  it("SEARCH_FAILED durumunda ilan yayınlandığını ve hatayı belirtmeli", () => {
    render(
      <AdCreationMatchModal
        state="SEARCH_FAILED"
        matches={[]}
        errorMessage="Baglanti zaman asimina ugradi"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("İlanınız Yayınlandı")).toBeInTheDocument();
    expect(
      screen.getByText(/eşleşme araması tamamlanamadı/i),
    ).toBeInTheDocument();
  });

  it("kapatma butonuna basıldığında onClose fonksiyonunu çağırmalı", () => {
    const handleClose = vi.fn();

    render(
      <AdCreationMatchModal
        state="NO_MATCH"
        matches={[]}
        onClose={handleClose}
      />,
    );

    const button = screen.getByRole("button", { name: /Tamam/i });
    fireEvent.click(button);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
