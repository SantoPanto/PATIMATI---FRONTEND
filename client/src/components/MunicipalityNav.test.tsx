import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MunicipalityNav from "./MunicipalityNav";

describe("MunicipalityNav", () => {
  it("'Ana sayfaya dön' butonunu gösterir ve href='/' olarak yönlendirir", () => {
    render(<MunicipalityNav />);

    const anaSayfaLink = screen.getByRole("link", { name: /Ana sayfaya dön/i });
    expect(anaSayfaLink).toBeInTheDocument();
    expect(anaSayfaLink).toHaveAttribute("href", "/");
  });

  it("Genel Bakış ve İhbar Kuyruğu sekmelerini içerir", () => {
    render(<MunicipalityNav />);

    expect(screen.getByRole("link", { name: /Genel Bakış/i })).toHaveAttribute(
      "href",
      "/municipality",
    );
    expect(screen.getByRole("link", { name: /İhbar Kuyruğu/i })).toHaveAttribute(
      "href",
      "/municipality/queue",
    );
  });
});
