import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * Gizlilik sayfasinin varligini ve tasidigi taahhutleri kilitler.
 *
 * <p><b>Neden bu dosya var:</b> kayit formu "gizlilik politikasini kabul
 * ediyorum" onayi istiyor; bu sayfa eklenmeden once onay hicbir metne isaret
 * etmiyordu (KVKK acigi). Bu test sayfanin bos birakilmasini/yanlislikla
 * bosaltilmasini ve iki kritik taahhudun — KVKK haklari bolumu ile
 * fotograflarin AI tarafindan analiz edildiginin acikca soylenmesi —
 * sessizce kaybolmasini engeller.
 *
 * <p>Header/Footer stublanir: bu test sayfanin ICERIGINI olcer, gezinme
 * bilesenlerinin kendi testleri zaten var.
 */

vi.mock("../components/Header", () => ({ default: () => <header /> }));
vi.mock("../components/Footer", () => ({ default: () => <footer /> }));

import GizlilikPage from "./GizlilikPage";

describe("GizlilikPage", () => {
  it("başlık ve KVKK hakları bölümü görünür", () => {
    render(<GizlilikPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Gizlilik Politikası" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "KVKK kapsamındaki haklarınız" }),
    ).toBeInTheDocument();
  });

  it("fotoğrafların AI ile analiz edildiği açıkça yazıyor", () => {
    render(<GizlilikPage />);

    expect(
      screen.getByText("Yapay zekâ ile eşleştirme:"),
    ).toBeInTheDocument();
  });
});
