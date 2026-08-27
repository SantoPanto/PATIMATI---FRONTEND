import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

/**
 * HelpCreatePage -- "Yardım" ilan türü (sade form): fotoğraf + başlık +
 * serbest metin açıklama + tür + tarih + konum. Irk/renk/yaş/cinsiyet YOK.
 * Sahiplendirme'nin aksine `/api/adoptions` DEĞİL, genel `/api/ads`'e
 * `adType: "HELP"` ile POST atar -- bu test tam olarak bunu kilitler.
 */

vi.mock("wouter", () => ({
  useLocation: () => ["/help/create", vi.fn()],
}));

vi.mock("../components/CreateAdLayout", () => ({
  default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

const { istek } = vi.hoisted(() => ({ istek: vi.fn() }));

vi.mock("../services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/api")>();
  return {
    ...actual,
    request: istek,
  };
});

vi.mock("../utils/imageCompression", () => ({
  compressImagesWithinLimit: vi.fn(async (dosyalar: File[]) => ({
    accepted: dosyalar,
    stillTooLarge: [],
  })),
}));

import HelpCreatePage from "./HelpCreatePage";

function fotografEkle(container: HTMLElement) {
  const girdi = container.querySelector('input[type="file"]') as HTMLInputElement;
  const dosya = new File(["foto"], "kedi.jpg", { type: "image/jpeg" });
  Object.defineProperty(girdi, "files", { value: [dosya], configurable: true });
  fireEvent.change(girdi);
}

async function formuDoldur(container: HTMLElement) {
  fotografEkle(container);
  await screen.findByText("1/3 fotoğraf yüklendi.");

  fireEvent.change(screen.getByPlaceholderText("40.195000"), {
    target: { value: "40.19" },
  });
  fireEvent.change(screen.getByPlaceholderText("29.060000"), {
    target: { value: "29.06" },
  });
  fireEvent.change(screen.getByPlaceholderText("Bursa"), {
    target: { value: "Bursa" },
  });
  fireEvent.change(screen.getByPlaceholderText(/Mahallede 3 kedi/), {
    target: { value: "Mahallede 3 kedi yardım bekliyor" },
  });
  fireEvent.change(screen.getByPlaceholderText(/Durumu anlat/), {
    target: { value: "3 kedi var, besliyorum, sizde besler misiniz?" },
  });

  const turSecimi = screen.getByRole("combobox");
  fireEvent.change(turSecimi, { target: { value: "CAT" } });

  fireEvent.click(
    screen.getByText("Bilgilerin doğruluğunu onaylıyorum.").closest("label")!
      .querySelector("input")!,
  );
}

describe("HelpCreatePage", () => {
  beforeEach(() => {
    istek.mockReset();
    istek.mockResolvedValue({ id: 1 });
    Object.defineProperty(URL, "createObjectURL", {
      value: () => "blob:deneme",
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: () => {},
      configurable: true,
    });
  });

  it("ırk/renk/yaş/cinsiyet alanı YOK -- yalnızca tür seçimi var", () => {
    render(<HelpCreatePage />);

    expect(screen.queryByPlaceholderText(/Tekir/)).toBeNull();
    expect(screen.queryByText("Irk")).toBeNull();
    expect(screen.queryByText("Cinsiyet")).toBeNull();
    expect(screen.getByText("Tür")).toBeInTheDocument();
  });

  it("form doldurulup gönderilince /api/ads'e adType HELP ile POST atar", async () => {
    const { container } = render(<HelpCreatePage />);
    await formuDoldur(container);

    fireEvent.click(screen.getByRole("button", { name: /Yardım ilanını yayınla/ }));

    await waitFor(() => expect(istek).toHaveBeenCalledTimes(1));

    const [url, options] = istek.mock.calls[0];
    expect(url).toBe("/api/ads");
    expect(options.method).toBe("POST");

    const formData = options.body as FormData;
    const adBlob = formData.get("ad") as Blob;
    const ad = JSON.parse(await adBlob.text());

    expect(ad.adType).toBe("HELP");
    expect(ad.species).toBe("CAT");
    expect(ad.title).toBe("Mahallede 3 kedi yardım bekliyor");
    expect(ad.description).toBe("3 kedi var, besliyorum, sizde besler misiniz?");
    expect(ad.isMatchRequired).toBe(false);
    expect(ad.breed).toBeUndefined();
    expect(ad.gender).toBeUndefined();
    expect(ad.ageGroup).toBeUndefined();
    expect(ad.coatPattern).toBeUndefined();
  });

  it("fotoğraf yoksa gönderim düğmesi devre dışı kalır", () => {
    render(<HelpCreatePage />);

    expect(
      screen.getByRole("button", { name: /Yardım ilanını yayınla/ }),
    ).toBeDisabled();
  });

  it("afiş izni kutusu render edilir ve varsayılan İŞARETLİDİR (kullanıcı kararı 28.08)", () => {
    render(<HelpCreatePage />);

    const kutu = screen.getByRole("checkbox", {
      name: /Afişin \(PDF\) oluşturulmasına izin veriyorum/i,
    }) as HTMLInputElement;

    expect(kutu.checked).toBe(true);
  });
});
