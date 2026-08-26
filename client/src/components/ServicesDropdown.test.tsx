import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * ServicesDropdown -- artık bir açılır menü DEĞİL, Header'daki "Hizmetler"
 * ikonu doğrudan /hizmetler toplu sayfasına giden bir link. Kullanıcı
 * isteği: "hizmetler kısmına tıkladığımızda üçünden birini seçme değilde
 * direkt olarak bizi hizmetler sayfasına yollasın."
 */

import ServicesDropdown from "./ServicesDropdown";

describe("ServicesDropdown", () => {
  it("Hizmetler ikonu doğrudan /hizmetler'e giden bir link, menü açmıyor", () => {
    render(<ServicesDropdown />);

    const link = screen.getByRole("link", { name: "Hizmetler" });
    expect(link).toHaveAttribute("href", "/hizmetler");
  });

  it("bir açılır menü render edilmiyor", () => {
    render(<ServicesDropdown />);

    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.queryByRole("menuitem")).toBeNull();
  });
});
