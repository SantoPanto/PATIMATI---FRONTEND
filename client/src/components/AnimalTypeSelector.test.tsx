import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AnimalTypeSelector from "./AnimalTypeSelector";

/**
 * Hayvan türü toggle-çip grid'i (plan §12) -- veteriner "baktığı hayvan
 * türleri"ni burada seçer.
 */
describe("AnimalTypeSelector", () => {
  it("10 çip Türkçe etiketle render olur", () => {
    render(<AnimalTypeSelector value={[]} onChange={vi.fn()} />);

    for (const label of [
      "Köpek",
      "Kedi",
      "Kuş",
      "Tavşan",
      "Kemirgen",
      "Sürüngen",
      "Balık",
      "Çiftlik Hayvanı",
      "Egzotik",
      "Diğer",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("seçili olmayan çipe tıklama listeye ekler", () => {
    const onChange = vi.fn();
    render(<AnimalTypeSelector value={["CAT"]} onChange={onChange} />);

    fireEvent.click(screen.getByText("Köpek"));

    expect(onChange).toHaveBeenCalledWith(["CAT", "DOG"]);
  });

  it("seçili çipe tıklama listeden çıkarır", () => {
    const onChange = vi.fn();
    render(<AnimalTypeSelector value={["CAT", "DOG"]} onChange={onChange} />);

    fireEvent.click(screen.getByText("Kedi"));

    expect(onChange).toHaveBeenCalledWith(["DOG"]);
  });
});
