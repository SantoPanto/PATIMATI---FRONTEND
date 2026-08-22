import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AdResponse } from "../services/types";

/**
 * Sahiplendirme sayfasinin SAYFALAMA davranisi (tablo satir 38).
 *
 * <p><b>Ölçülen durum (22.08):</b> sayfa tek seferde 100 ilan cekip hepsini
 * alt alta basiyordu; sayfalama yoktu. Duzeltme istemci tarafinda sayfalar:
 * arama/tur/cinsiyet suzgecleri TAM kumenin ustunde calismayi surdurur,
 * gorunen liste 20'serlik sayfalara bolunur (Ilanlar sayfasiyla ayni boy).
 *
 * <p><b>Neden istemci tarafi:</b> suzgecler istemcide. Sunucu sayfalamasina
 * gecmek aramayi yalniz gorunen sayfayla sinirlardi (davranis bozulurdu);
 * sunucu tarafina gecis, adoptions ucuna arama parametresi eklenen gunun isi.
 *
 * <p><b>Kritik iddia (3. vaka):</b> 2. sayfadayken suzgec daralinca taskin
 * sayfa BOS EKRAN cizmemeli — hem handler sifirlamasi hem currentPage klempi
 * bunu koruyor. tsc bu sinifi goremez: slice(40,60) ile slice(0,20) ayni
 * tiptedir.
 */

const { sahiplendirmeGetir, kamuIlanGetir } = vi.hoisted(() => ({
  sahiplendirmeGetir: vi.fn(),
  kamuIlanGetir: vi.fn(),
}));

vi.mock("../services/adoptions", () => ({
  getPublicAdoptions: sahiplendirmeGetir,
}));

vi.mock("../services/ads", () => ({
  getPublicAds: kamuIlanGetir,
}));

vi.mock("wouter", () => ({
  Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock("../components/Header", () => ({ default: () => <header /> }));
vi.mock("../components/Footer", () => ({ default: () => <footer /> }));

import Adoption from "./Adoption";

const TEMEL: AdResponse = {
  id: 1,
  title: "Sahiplendirme 1",
  description: "",
  adType: "ADOPTION",
  species: "CAT",
  breed: "MIXED_OR_UNKNOWN",
  colors: [],
  gender: "UNKNOWN",
  ageGroup: "UNKNOWN",
  coatPattern: "UNKNOWN",
  collarStatus: "UNKNOWN",
  earTagStatus: "UNKNOWN",
  earNotchStatus: "UNKNOWN",
  microchipped: false,
  photoUrls: [],
  latitude: 40.1,
  longitude: 29.0,
  ownerId: 7,
  ownerDisplayName: "Sahip",
  active: true,
  suspended: false,
  createdAt: "2026-08-21T00:00:00Z",
  updatedAt: "2026-08-21T00:00:00Z",
};

function ilanUret(adet: number): AdResponse[] {
  return Array.from({ length: adet }, (_, i) => ({
    ...TEMEL,
    id: i + 1,
    title: `Sahiplendirme ${i + 1}`,
  }));
}

function sunucudanVer(ilanlar: AdResponse[]) {
  sahiplendirmeGetir.mockResolvedValue({ content: ilanlar });
}

function sayfaGostergesi(): HTMLElement | null {
  return screen.queryByText(
    (_, element) =>
      element?.tagName === "SPAN" &&
      /^\d+ \/ \d+$/.test(element.textContent ?? ""),
  );
}

beforeEach(() => {
  sahiplendirmeGetir.mockReset();
  kamuIlanGetir.mockReset();
  kamuIlanGetir.mockResolvedValue({ content: [] });
});

describe("Sahiplendirme sayfalaması", () => {
  it("30 ilanda ilk sayfa 20 kart çizer, gösterge 1 / 2, sayaç 30", async () => {
    sunucudanVer(ilanUret(30));

    render(<Adoption />);

    await screen.findByText("Sahiplendirme 1");
    expect(screen.getAllByRole("article")).toHaveLength(20);
    expect(screen.queryByText("Sahiplendirme 21")).not.toBeInTheDocument();
    expect(sayfaGostergesi()).toHaveTextContent("1 / 2");
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("Sonraki sayfa kalan 10 ilanı gösterir ve ileri düğmesi kilitlenir", async () => {
    sunucudanVer(ilanUret(30));

    render(<Adoption />);
    await screen.findByText("Sahiplendirme 1");

    fireEvent.click(screen.getByLabelText("Sonraki sayfa"));

    expect(screen.getByText("Sahiplendirme 21")).toBeInTheDocument();
    expect(screen.queryByText("Sahiplendirme 1")).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(10);
    expect(sayfaGostergesi()).toHaveTextContent("2 / 2");
    expect(screen.getByLabelText("Sonraki sayfa")).toBeDisabled();
  });

  it("2. sayfadayken arama daraltınca boş ekran ÇİZMEZ, başa döner", async () => {
    sunucudanVer(ilanUret(30));

    render(<Adoption />);
    await screen.findByText("Sahiplendirme 1");
    fireEvent.click(screen.getByLabelText("Sonraki sayfa"));

    // "Sahiplendirme 3" / 13 / 23 / 30 eşleşir — 4 sonuç, tek sayfa.
    fireEvent.change(
      screen.getByLabelText("Sahiplendirme ilanlarında ara"),
      { target: { value: "3" } },
    );

    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(screen.getByText("Sahiplendirme 3")).toBeInTheDocument();
    expect(sayfaGostergesi()).toBeNull();

    // Arama GENİŞLEYİNCE de baştan başlar: klemp burada korumaz (taşma
    // yok), koruma handler'daki sıfırlama — sökülürse kullanıcı 2. sayfada
    // "kaldığı yerden" görürdü.
    fireEvent.change(
      screen.getByLabelText("Sahiplendirme ilanlarında ara"),
      { target: { value: "" } },
    );

    expect(sayfaGostergesi()).toHaveTextContent("1 / 2");
    expect(screen.getByText("Sahiplendirme 1")).toBeInTheDocument();
  });

  it("tek sayfaya sığan listede (canlıdaki 2 ilan) sayfalama çizilmez", async () => {
    sunucudanVer(ilanUret(2));

    render(<Adoption />);

    await screen.findByText("Sahiplendirme 1");
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(sayfaGostergesi()).toBeNull();
    expect(screen.queryByLabelText("Sonraki sayfa")).not.toBeInTheDocument();
  });
});
