import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

/**
 * Sahiplendirme formunda ELLE koordinat girisi (22.08 saha bulgusu).
 *
 * <p><b>Olculen durum:</b> koordinatin tek kaynagi GPS'ti; konum iznini
 * reddeden kullanici "Konum alinamadi..." hatasina takilip ilani HIC
 * paylasamiyordu (il/ilce metni koordinat yerine gecmez, backend
 * latitude/longitude'u @NotNull ister). Kayip ve bulundu formlarinda
 * elle enlem/boylam girisi vardi, bu formda yoktu.
 *
 * <p>Bu testler elle giris YOLUNUN varligini kilitler: alanlar formda,
 * required ve GPS'e dokunmadan yazilabilir. Elle koordinat girilebildigi
 * surece izin reddi cikmaz sokak degildir.
 */

vi.mock("wouter", () => ({
  useLocation: () => ["/adoption/create", vi.fn()],
}));

vi.mock("../components/CreateAdLayout", () => ({
  default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../services/api", () => ({
  request: vi.fn(),
}));

import AdoptionCreatePage from "./AdoptionCreatePage";

describe("AdoptionCreatePage elle konum girisi", () => {
  it("enlem ve boylam alanlari formda ve required", () => {
    render(<AdoptionCreatePage />);

    const enlem = screen.getByPlaceholderText(
      "40.195000",
    ) as HTMLInputElement;
    const boylam = screen.getByPlaceholderText(
      "29.060000",
    ) as HTMLInputElement;

    expect(enlem.required).toBe(true);
    expect(boylam.required).toBe(true);
  });

  it("GPS kullanmadan elle koordinat yazilabiliyor", () => {
    render(<AdoptionCreatePage />);

    const enlem = screen.getByPlaceholderText(
      "40.195000",
    ) as HTMLInputElement;
    const boylam = screen.getByPlaceholderText(
      "29.060000",
    ) as HTMLInputElement;

    fireEvent.change(enlem, { target: { value: "40.19" } });
    fireEvent.change(boylam, { target: { value: "29.06" } });

    expect(enlem.value).toBe("40.19");
    expect(boylam.value).toBe("29.06");
  });
});
