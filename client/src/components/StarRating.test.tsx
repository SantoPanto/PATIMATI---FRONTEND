import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import StarRating from "./StarRating";

/**
 * 1-5 yıldız puanlama bileşeni (plan §12).
 *
 * <p>Taşıyıcı iddialar: `value`'ye göre dolu yıldız SAYISI doğru; `readOnly`
 * modda tıklama `onChange`'i HİÇ tetiklemez (salt-okunur rozet -- örn.
 * VetDetailPage/VetDirectoryPage'de gösterilen ortalama puan -- yanlışlıkla
 * "yorum yaz" formu gibi davranmasın); interaktif modda bir yıldıza tıklama
 * doğru değeri iletir.
 */
describe("StarRating", () => {
  it("value=3 iken 3 yıldız dolu, 2 yıldız boş render edilir", () => {
    render(<StarRating value={3} readOnly />);

    const stars = screen.getAllByTestId(/^star-rating-star-/);
    expect(stars).toHaveLength(5);

    const filled = stars.filter((star) => star.getAttribute("data-filled") === "true");
    expect(filled).toHaveLength(3);
  });

  it("readOnly modda tıklama onChange tetiklemez", () => {
    const onChange = vi.fn();
    render(<StarRating value={2} onChange={onChange} readOnly />);

    const stars = screen.getAllByTestId(/^star-rating-star-/);
    fireEvent.click(stars[3]);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("interaktif modda 4. yıldıza tıklama onChange(4) çağırır", () => {
    const onChange = vi.fn();
    render(<StarRating value={2} onChange={onChange} />);

    const stars = screen.getAllByTestId(/^star-rating-star-/);
    fireEvent.click(stars[3]);

    expect(onChange).toHaveBeenCalledWith(4);
  });
});
