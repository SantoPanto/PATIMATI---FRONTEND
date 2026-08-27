import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * PetShopPanelPage -- 2 sekmeli panel (plan §12, §B.3): "Petshop Kartı" +
 * "Ürünlerim". Kart yükleme/kaydetme + konum (`VetPanelPage` deseni, hayvan
 * türü seçici YOK) + ürün sekmesi (liste, ekleme, satır-içi düzenleme,
 * silme, fiyat doğrulaması).
 *
 * <p><b>Regresyon güvencesi:</b> "Gelen İstekler"/"Müşterilerim" sekmesinin
 * RENDER EDİLMEDİĞİNİ açıkça doğrular -- bir petshop'un veterinerin aksine
 * süregelen bir müşteri ilişkisi kavramı YOK (plan "Bilinçli kapsam
 * sınırları").
 *
 * <p>Gerçek Leaflet/jsdom ağır olduğundan `MapPicker` test-id'li kontrollü
 * bir stub'a indirgeniyor (VetPanelPage.test.tsx ile aynı mock şekli).
 */

const { getMyPetShop, upsertMyPetShop } = vi.hoisted(() => ({
  getMyPetShop: vi.fn(),
  upsertMyPetShop: vi.fn(),
}));

const { listMyProducts, createProduct, updateProduct, deleteProduct } = vi.hoisted(() => ({
  listMyProducts: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

vi.mock("../services/petshop", () => ({ getMyPetShop, upsertMyPetShop }));
vi.mock("../services/petshopProducts", () => ({
  listMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
}));

vi.mock("../components/Header", () => ({ default: () => <header /> }));
vi.mock("../components/Footer", () => ({ default: () => <footer /> }));

vi.mock("../components/MapPicker", () => ({
  default: ({
    latitude,
    longitude,
    onChange,
  }: {
    latitude?: number | null;
    longitude?: number | null;
    onChange?: (lat: number, lng: number) => void;
  }) => (
    <div data-testid="map-picker-stub">
      <span data-testid="map-lat">{latitude ?? ""}</span>
      <span data-testid="map-lng">{longitude ?? ""}</span>
      <button type="button" onClick={() => onChange?.(40.1, 29.5)}>
        haritada-konum-sec
      </button>
    </div>
  ),
}));

import PetShopPanelPage from "./PetShopPanelPage";

function stub<T>(fn: ReturnType<typeof vi.fn>, value: T) {
  fn.mockResolvedValue(value);
}

const PRODUCT_1 = {
  id: 1,
  petShopId: 3,
  name: "Kedi Maması 1kg",
  description: "Tahılsız kedi maması",
  price: 149.9,
  photoUrl: null,
  averageRating: 4.5,
  reviewCount: 2,
  createdAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-01T10:00:00Z",
};

function productPage(content: unknown[]) {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: 20,
    number: 0,
    first: true,
    last: true,
    empty: content.length === 0,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  stub(getMyPetShop, null);
  stub(upsertMyPetShop, {
    id: 3,
    name: "Pati Petshop",
    address: "Adres",
    city: "Ankara",
    district: null,
    phone: "0312 000 00 00",
    workingHours: null,
    photoUrl: null,
    latitude: 40.1,
    longitude: 29.5,
  });
  stub(listMyProducts, productPage([]));
});

function tabButtons() {
  return screen
    .getAllByRole("button")
    .filter((button) =>
      ["Petshop Kartı", "Ürünlerim"].includes(button.textContent?.trim() ?? ""),
    );
}

describe("PetShopPanelPage — sekmeler", () => {
  it("yalnızca 'Petshop Kartı' ve 'Ürünlerim' sekmeleri render edilir", async () => {
    render(<PetShopPanelPage />);

    await waitFor(() => expect(getMyPetShop).toHaveBeenCalled());

    const labels = tabButtons().map((button) => button.textContent?.trim());
    expect(labels).toEqual(["Petshop Kartı", "Ürünlerim"]);
  });

  it("'Gelen İstekler' veya 'Müşterilerim' sekmesi HİÇ render edilmez", async () => {
    render(<PetShopPanelPage />);

    await waitFor(() => expect(getMyPetShop).toHaveBeenCalled());

    expect(screen.queryByText("Gelen İstekler")).toBeNull();
    expect(screen.queryByText("Müşterilerim")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Ürünlerim/ }));
    await waitFor(() => expect(listMyProducts).toHaveBeenCalled());

    expect(screen.queryByText("Gelen İstekler")).toBeNull();
    expect(screen.queryByText("Müşterilerim")).toBeNull();
  });

  it("varsayılan aktif sekme Petshop Kartı'dır", async () => {
    render(<PetShopPanelPage />);

    await waitFor(() => expect(getMyPetShop).toHaveBeenCalled());

    expect(screen.getByPlaceholderText("Pati Petshop")).toBeInTheDocument();
    expect(listMyProducts).not.toHaveBeenCalled();
  });
});

describe("PetShopPanelPage — Petshop Kartı: konum", () => {
  it("mock'lanmış MapPicker render edilir, hayvan türü seçici YOK", async () => {
    render(<PetShopPanelPage />);

    await waitFor(() => expect(getMyPetShop).toHaveBeenCalled());

    expect(screen.getByTestId("map-picker-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("animal-type-selector-stub")).toBeNull();
  });

  it("harita onChange'i tetiklenince state günceller ve kayıt isteğine latitude/longitude dahil olur", async () => {
    render(<PetShopPanelPage />);

    await waitFor(() => expect(screen.getByPlaceholderText("Pati Petshop")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("Pati Petshop"), {
      target: { value: "Pati Petshop" },
    });
    fireEvent.change(screen.getByPlaceholderText("Örnek Mah. 1. Sk. No:1"), {
      target: { value: "Adres" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ankara"), {
      target: { value: "Ankara" },
    });
    fireEvent.change(screen.getByPlaceholderText("0312 000 00 00"), {
      target: { value: "0312 000 00 00" },
    });

    fireEvent.click(screen.getByText("haritada-konum-sec"));
    expect(screen.getByTestId("map-lat")).toHaveTextContent("40.1");
    expect(screen.getByTestId("map-lng")).toHaveTextContent("29.5");

    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() =>
      expect(upsertMyPetShop).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 40.1,
          longitude: 29.5,
        }),
      ),
    );
  });
});

describe("PetShopPanelPage — Ürünlerim", () => {
  it("ürün listesi yüklenir ve render edilir", async () => {
    stub(listMyProducts, productPage([PRODUCT_1]));

    render(<PetShopPanelPage />);
    await waitFor(() => expect(getMyPetShop).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /Ürünlerim/ }));

    expect(await screen.findByText("Kedi Maması 1kg")).toBeInTheDocument();
    expect(screen.getByText("₺149.90")).toBeInTheDocument();
    expect(screen.getByText("Tahılsız kedi maması")).toBeInTheDocument();
  });

  it("boş listede 'Henüz bir ürün eklemediniz.' gösterir", async () => {
    render(<PetShopPanelPage />);
    await waitFor(() => expect(getMyPetShop).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /Ürünlerim/ }));

    expect(await screen.findByText("Henüz bir ürün eklemediniz.")).toBeInTheDocument();
  });

  it("ürün ekleme formu gönderilince listenin başına eklenir", async () => {
    const yeniUrun = { ...PRODUCT_1, id: 99, name: "Köpek Tasması" };
    createProduct.mockResolvedValue(yeniUrun);
    stub(listMyProducts, productPage([PRODUCT_1]));

    render(<PetShopPanelPage />);
    await waitFor(() => expect(getMyPetShop).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /Ürünlerim/ }));
    await screen.findByText("Kedi Maması 1kg");

    fireEvent.change(screen.getByPlaceholderText("Kedi Maması 1kg"), {
      target: { value: "Köpek Tasması" },
    });
    fireEvent.change(screen.getByPlaceholderText("149.90"), {
      target: { value: "89.90" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Ürünü Ekle" }));

    await waitFor(() =>
      expect(createProduct).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Köpek Tasması", price: 89.9 }),
      ),
    );

    const productNames = (await screen.findAllByRole("heading", { level: 3 })).map(
      (heading) => heading.textContent,
    );
    expect(productNames[0]).toBe("Köpek Tasması");
  });

  it("fiyat input'u 0'dan büyük olmayan değeri kabul etmez (min=0.01, @DecimalMin yansıması), createProduct çağrılmaz", async () => {
    render(<PetShopPanelPage />);
    await waitFor(() => expect(getMyPetShop).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /Ürünlerim/ }));
    await waitFor(() => expect(listMyProducts).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText("Kedi Maması 1kg"), {
      target: { value: "Geçersiz Ürün" },
    });
    const priceInput = screen.getByPlaceholderText("149.90") as HTMLInputElement;
    expect(priceInput).toHaveAttribute("min", "0.01");
    expect(priceInput).toHaveAttribute("type", "number");
    fireEvent.change(priceInput, { target: { value: "0" } });

    fireEvent.click(screen.getByRole("button", { name: "Ürünü Ekle" }));

    // jsdom, min="0.01" doğrulamasını native form-submit sırasında uygular --
    // submit olayı hiç tetiklenmez, bu yüzden handler'ımız (ve dolayısıyla
    // createProduct) hiç çağrılmaz.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("JS-taraflı doğrulama: fiyat programatik olarak 0 gönderilirse (native kontrolü aşan bir durum) hata mesajı gösterir", async () => {
    render(<PetShopPanelPage />);
    await waitFor(() => expect(getMyPetShop).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /Ürünlerim/ }));
    await waitFor(() => expect(listMyProducts).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText("Kedi Maması 1kg"), {
      target: { value: "Geçersiz Ürün" },
    });
    const priceInput = screen.getByPlaceholderText("149.90") as HTMLInputElement;
    // min/step doğrulamasını atlayıp doğrudan boş bırakmak, formun
    // JS-taraflı `handleAdd` doğrulamasına düşmesini sağlar (tarayıcı boş
    // input'u "eksik değer" olarak değil `required` ile engeller; burada
    // `required` alanını da dolduruyoruz ki submit native engellenmeden
    // handler'a ulaşsın).
    fireEvent.change(priceInput, { target: { value: "" } });
    priceInput.removeAttribute("required");
    priceInput.removeAttribute("min");

    fireEvent.click(screen.getByRole("button", { name: "Ürünü Ekle" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ürün adı ve 0'dan büyük bir fiyat zorunludur.",
    );
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("satır-içi düzenleme: Kaydet'e basınca updateProduct çağrılır ve liste güncellenir", async () => {
    stub(listMyProducts, productPage([PRODUCT_1]));
    updateProduct.mockResolvedValue({ ...PRODUCT_1, name: "Güncellenmiş Ürün", price: 199.9 });

    render(<PetShopPanelPage />);
    await waitFor(() => expect(getMyPetShop).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /Ürünlerim/ }));
    await screen.findByText("Kedi Maması 1kg");

    fireEvent.click(screen.getByRole("button", { name: "Düzenle" }));

    const nameInput = screen.getByDisplayValue("Kedi Maması 1kg");
    fireEvent.change(nameInput, { target: { value: "Güncellenmiş Ürün" } });

    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() =>
      expect(updateProduct).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: "Güncellenmiş Ürün" }),
      ),
    );
    expect(await screen.findByText("Güncellenmiş Ürün")).toBeInTheDocument();
  });

  it("silme onaylanınca deleteProduct çağrılır ve ürün listeden kaldırılır", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    stub(listMyProducts, productPage([PRODUCT_1]));
    deleteProduct.mockResolvedValue(undefined);

    render(<PetShopPanelPage />);
    await waitFor(() => expect(getMyPetShop).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /Ürünlerim/ }));
    await screen.findByText("Kedi Maması 1kg");

    fireEvent.click(screen.getByRole("button", { name: "Sil" }));

    await waitFor(() => expect(deleteProduct).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText("Kedi Maması 1kg")).toBeNull());
  });
});
