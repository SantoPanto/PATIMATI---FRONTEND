import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * /report — belediye kimliğinin bekçisi (S1, 27.08 isteği).
 *
 * <p><b>Neden:</b> sayfa "Yardım Et" akışıyla karıştırılıyordu; başlık ve
 * banner, ihbarın uygulama ekibine değil BELEDİYEYE gittiğini söylemek
 * zorunda. Bu metinler gevşetilir ya da silinirse test düşer.
 *
 * <p>MapPicker sahte: jsdom'da leaflet güvenilir render edilmiyor (belediye
 * paneli testindeki desen). Ölçülen şey harita değil, kimlik metinleri ve
 * konumsuz gönderimin belediye-yönlendirme uyarısı.
 */

vi.mock("../components/MapPicker", () => ({
  default: ({ onChange }: { onChange?: (lat: number, lng: number) => void }) => (
    <button
      type="button"
      data-testid="konum-sec"
      onClick={() => onChange?.(40.19, 29.06)}
    >
      konum seç
    </button>
  ),
}));

const { ihbarYarat } = vi.hoisted(() => ({ ihbarYarat: vi.fn() }));

vi.mock("../services/reportService", async (gercegi) => ({
  ...(await gercegi<typeof import("../services/reportService")>()),
  createReport: ihbarYarat,
}));

import PublicReportPage from "./PublicReportPage";

describe("PublicReportPage — belediye kimliği", () => {
  it("başlık, üst yazı ve banner ihbarın belediyeye gittiğini söylüyor", () => {
    render(<PublicReportPage />);

    expect(
      screen.getByRole("heading", { name: "Belediyeye Hayvan İhbarı" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Belediye İhbar Hattı")).toBeInTheDocument();
    expect(
      screen.getByText(/ilçesindeki belediyenin ihbar kuyruğuna düşer/),
    ).toBeInTheDocument();
  });

  it("konum seçilmeden gönderim, belediyeye yönlendirme uyarısı veriyor ve istek atmıyor", () => {
    render(<PublicReportPage />);

    // jsdom, submit düğmesine tıklamayı form submit'ine çevirmiyor —
    // formu doğrudan submit'liyoruz (ölçülen davranış aynı).
    const dugme = screen.getByRole("button", { name: "İhbarı Gönder" });
    fireEvent.submit(dugme.closest("form") as HTMLFormElement);

    expect(
      screen.getByText(/konuma göre belediyeye yönlendiriliyor/),
    ).toBeInTheDocument();
    expect(ihbarYarat).not.toHaveBeenCalled();
  });
});
