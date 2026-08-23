import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";

/**
 * "AI analizi tamamlandı" YAZIYOR ama hiçbir alan dolmuyor (23.08 saha
 * şikâyeti, ekran görüntüsü 7).
 *
 * <p><b>Ölçülen mekanizma:</b> AI servisinde öznitelik çıkarımı herhangi bir
 * istisnada sessizce yutuluyor ve şu sonuç dönüyor
 * (PATIMATI-AI/app/main.py:145-152):
 *
 * <pre>{"labels": [], "species": "unknown", "breed": null, "pattern": null,
 *  "colors": [], "is_pet": true}</pre>
 *
 * Tasarım gereği böyle ("öznitelik hatası tüm analizi düşürmemeli" —
 * embedding hesaplandığı için eşleştirme etiketsiz de çalışır). Ama ön yüz
 * yalnız `is_pet === false` durumunu ayırıyordu; bu cevap `is_pet: true`
 * olduğu için ekran "tamamlandı" yazıyor, kullanıcı boş formu kendi hatası
 * sanıyordu.
 *
 * <p>Bu test cevabın İÇERİĞİNE bakan davranışı kilitliyor. Tip denetimi
 * göremez: iki durumda da dönen tip aynı.
 */

vi.mock("wouter", () => ({
  useLocation: () => ["/adoption/create", vi.fn()],
}));

vi.mock("../components/CreateAdLayout", () => ({
  default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

const { istek } = vi.hoisted(() => ({ istek: vi.fn() }));

vi.mock("../services/api", () => ({
  request: istek,
}));

vi.mock("../utils/imageCompression", () => ({
  compressImagesWithinLimit: vi.fn(async (dosyalar: File[]) => ({
    accepted: dosyalar,
    stillTooLarge: [],
  })),
}));

import AdoptionCreatePage from "./AdoptionCreatePage";
import AddListingPage from "./AddListingPage";

async function fotografEkleVeAnalizEt(container: HTMLElement) {
  const girdi = container.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;

  const dosya = new File(["foto"], "kedi.jpg", { type: "image/jpeg" });
  Object.defineProperty(girdi, "files", { value: [dosya], configurable: true });
  fireEvent.change(girdi);

  const dugme = await screen.findByRole("button", {
    name: /AI ile otomatik doldur|Analiz/i,
  });
  fireEvent.click(dugme);
}

describe("AI oto-doldurma mesajı sonucu YANSITIR", () => {
  beforeEach(() => {
    istek.mockReset();
    // URL.createObjectURL jsdom'da yok; önizleme için gerekiyor.
    Object.defineProperty(URL, "createObjectURL", {
      value: () => "blob:deneme",
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: () => {},
      configurable: true,
    });
  });

  it("AI hiçbir şey çıkaramadığında 'tamamlandı' DEMEZ", async () => {
    // Üretimdeki sessiz yedek cevap birebir.
    istek.mockResolvedValue({
      labels: [],
      species: "unknown",
      breed: null,
      pattern: null,
      colors: [],
      is_pet: true,
    });

    const { container } = render(<AdoptionCreatePage />);
    await fotografEkleVeAnalizEt(container);

    await waitFor(() => {
      expect(
        screen.getByText(/çıkaramadı — alanları elle doldurun/i),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText(/Bilgiler forma aktarıldı/i)).toBeNull();
  });

  it("AI gerçekten tür/cins döndürdüğünde 'tamamlandı' der", async () => {
    istek.mockResolvedValue({
      labels: ["soft:color_white"],
      species: "cat",
      breed: "Tekir",
      pattern: "tabby",
      colors: [],
      is_pet: true,
    });

    const { container } = render(<AdoptionCreatePage />);
    await fotografEkleVeAnalizEt(container);

    await waitFor(() => {
      expect(
        screen.getByText(/Bilgiler forma aktarıldı/i),
      ).toBeInTheDocument();
    });
  });

  it("backend'in YENİ cevap şekliyle de doldurur (#156: coatPattern/colors/isPet)", async () => {
    // AiAnalyzeMapper'ın cevabı: `labels` HİÇ yok, renkler `colors`ta enum
    // adı, `is_pet` yerine `isPet`. Normalleştirme olmasa hiçbir alan dolmaz
    // ve ekran "elle doldurun" derdi.
    istek.mockResolvedValue({
      species: "CAT",
      speciesConfidence: 0.97,
      breed: "Tekir",
      breedConfidence: 0.81,
      coatPattern: "TABBY",
      colors: ["GRAY", "WHITE"],
      isPet: true,
    });

    const { container } = render(<AdoptionCreatePage />);
    await fotografEkleVeAnalizEt(container);

    await waitFor(() => {
      expect(
        screen.getByText(/Bilgiler forma aktarıldı/i),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/çıkaramadı — alanları elle doldurun/i),
    ).toBeNull();
  });
});

/**
 * Kayıp ilan formunda mesajın EŞLEŞTİRME BİTİNCE SİLİNMESİ.
 *
 * <p>Tarayıcıda ölçüldü (24.08, yerel, gerçek fotoğrafla): AI boş cevap
 * döndüğünde doğru metin ekrana geliyor, ama hemen ardından koşan
 * /api/ai-match isteğinin `finally` bloğu analysisMessage'ı siliyordu.
 * Yani kullanıcıya "alanları elle doldurun" diyen tek satır, eşleştirme
 * hızlıysa hiç okunamadan kayboluyordu. Ölçüm çıktısı:
 *   akış boyunca görülen: ["Fotoğraf AI tarafından analiz ediliyor...",
 *                          "AI bu fotoğraftan tür/cins/renk çıkaramadı..."]
 *   sonunda ekranda kalan: []
 */
describe("kayıp formunda AI mesajı eşleşme sonrası", () => {
  beforeEach(() => {
    istek.mockReset();
    Object.defineProperty(URL, "createObjectURL", { value: () => "blob:deneme", configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: () => {}, configurable: true });
  });

  async function analizEt(container: HTMLElement) {
    const girdi = container.querySelector('input[type="file"]') as HTMLInputElement;
    const dosya = new File(["foto"], "kopek.jpg", { type: "image/jpeg" });
    Object.defineProperty(girdi, "files", { value: [dosya], configurable: true });
    fireEvent.change(girdi);
    const dugme = await screen.findByRole("button", { name: /Analiz/i });
    fireEvent.click(dugme);
  }

  it("hiçbir alan dolmadıysa uyarı eşleştirmeden SONRA da ekranda kalır", async () => {
    istek
      .mockResolvedValueOnce({ labels: [], species: "unknown", breed: null, pattern: null, colors: [], is_pet: true })
      .mockResolvedValueOnce([]);

    const { container } = render(<AddListingPage />);
    await analizEt(container);

    await waitFor(() => expect(istek).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      expect(screen.getByText(/çıkaramadı — alanları elle doldurun/i)).toBeInTheDocument();
    });
  });

  it("alanlar dolduysa mesaj temizlenir (form zaten sonucu gösteriyor)", async () => {
    istek
      .mockResolvedValueOnce({ labels: [], species: "dog", breed: "Golden Retriever", pattern: null, colors: [], is_pet: true })
      .mockResolvedValueOnce([]);

    const { container } = render(<AddListingPage />);
    await analizEt(container);

    await waitFor(() => expect(istek).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      expect(screen.queryByText(/AI analizi tamamlandı/i)).toBeNull();
    });
    // Pozitif kontrol: gerçekten dolmuş.
    expect((screen.getByPlaceholderText(/AI tarafından otomatik doldurulur/i) as HTMLInputElement).value)
      .toBe("Golden Retriever");
  });
});
