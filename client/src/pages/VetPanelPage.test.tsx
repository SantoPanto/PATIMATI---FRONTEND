import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * VetPanelPage -- sekme sırası (istek #5) + klinik formuna konum/hayvan türü
 * eklenmesi (istek #1, #2), plan §13/§B.4.
 *
 * <p><b>Sekme sırası testi bilerek bugünkü koda karşı KIRMIZI yazıldı:</b>
 * şu an JSX sırası Klinik Kartı → Gelen İstekler → Müşterilerim; istenen
 * Klinik Kartı → Müşterilerim → Gelen İstekler. Bu test, JSX yeniden
 * sıralanana kadar kırmızı kalmalı.
 *
 * <p>Gerçek Leaflet/jsdom ağır olduğundan `MapPicker` ve `AnimalTypeSelector`
 * test-id'li kontrollü stub'lara indirgeniyor.
 */

const { getMyClinic, upsertMyClinic } = vi.hoisted(() => ({
  getMyClinic: vi.fn(),
  upsertMyClinic: vi.fn(),
}));

const {
  getIncomingRequests,
  getMyCustomers,
  acceptRequest,
  rejectRequest,
  getCustomerPets,
  addTreatmentNote,
} = vi.hoisted(() => ({
  getIncomingRequests: vi.fn(),
  getMyCustomers: vi.fn(),
  acceptRequest: vi.fn(),
  rejectRequest: vi.fn(),
  getCustomerPets: vi.fn(),
  addTreatmentNote: vi.fn(),
}));

const {
  addPetVaccination,
  addPetWeightLog,
  deletePetTreatmentNote,
  getPetTreatmentNotes,
  getPetVaccinations,
  getPetWeightLogs,
  updatePetTreatmentNote,
} = vi.hoisted(() => ({
  addPetVaccination: vi.fn(),
  addPetWeightLog: vi.fn(),
  deletePetTreatmentNote: vi.fn(),
  getPetTreatmentNotes: vi.fn(),
  getPetVaccinations: vi.fn(),
  getPetWeightLogs: vi.fn(),
  updatePetTreatmentNote: vi.fn(),
}));

vi.mock("../services/vet", () => ({ getMyClinic, upsertMyClinic }));
vi.mock("../services/vetCustomers", () => ({
  getIncomingRequests,
  getMyCustomers,
  acceptRequest,
  rejectRequest,
  getCustomerPets,
  addTreatmentNote,
}));
vi.mock("../services/pets", () => ({
  addPetVaccination,
  addPetWeightLog,
  deletePetTreatmentNote,
  getPetTreatmentNotes,
  getPetVaccinations,
  getPetWeightLogs,
  updatePetTreatmentNote,
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

vi.mock("../components/AnimalTypeSelector", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string[];
    onChange: (value: string[]) => void;
  }) => (
    <div data-testid="animal-type-selector-stub">
      <button type="button" onClick={() => onChange([...value, "CAT"])}>
        tur-sec
      </button>
    </div>
  ),
}));

import VetPanelPage from "./VetPanelPage";

function stub<T>(fn: ReturnType<typeof vi.fn>, value: T) {
  fn.mockResolvedValue(value);
}

beforeEach(() => {
  vi.clearAllMocks();
  stub(getMyClinic, null);
  stub(upsertMyClinic, {
    id: 1,
    name: "Pati Veteriner",
    address: "Adres",
    city: "Ankara",
    district: null,
    phone: "0312 000 00 00",
    workingHours: null,
    photoUrl: null,
    latitude: 40.1,
    longitude: 29.5,
    animalTypes: ["CAT"],
    averageRating: null,
    reviewCount: 0,
  });
  stub(getIncomingRequests, []);
  stub(getMyCustomers, []);
});

function tabButtons() {
  return screen
    .getAllByRole("button")
    .filter((button) =>
      ["Klinik Kartı", "Müşterilerim", "Gelen İstekler"].includes(
        button.textContent?.trim() ?? "",
      ),
    );
}

describe("VetPanelPage — sekme sırası", () => {
  it("tab butonları Klinik Kartı, Müşterilerim, Gelen İstekler sırasıyla dizilir", async () => {
    render(<VetPanelPage />);

    await waitFor(() => expect(getMyClinic).toHaveBeenCalled());

    const labels = tabButtons().map((button) => button.textContent?.trim());
    expect(labels).toEqual(["Klinik Kartı", "Müşterilerim", "Gelen İstekler"]);
  });

  it("varsayılan aktif sekme Klinik Kartı'dır", async () => {
    render(<VetPanelPage />);

    await waitFor(() => expect(getMyClinic).toHaveBeenCalled());

    expect(screen.getByPlaceholderText("Pati Veteriner Kliniği")).toBeInTheDocument();
    expect(getIncomingRequests).not.toHaveBeenCalled();
    expect(getMyCustomers).not.toHaveBeenCalled();
  });
});

describe("VetPanelPage — Klinik Kartı: konum + hayvan türleri", () => {
  it("mock'lanmış MapPicker ve AnimalTypeSelector render edilir", async () => {
    render(<VetPanelPage />);

    await waitFor(() => expect(getMyClinic).toHaveBeenCalled());

    expect(screen.getByTestId("map-picker-stub")).toBeInTheDocument();
    expect(screen.getByTestId("animal-type-selector-stub")).toBeInTheDocument();
  });

  it("harita onChange'i tetiklenince state günceller ve kayıt isteğine latitude/longitude/animalTypes dahil olur", async () => {
    render(<VetPanelPage />);

    await waitFor(() => expect(getMyClinic).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText("Pati Veteriner Kliniği"), {
      target: { value: "Pati Veteriner" },
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

    fireEvent.click(screen.getByText("tur-sec"));

    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() =>
      expect(upsertMyClinic).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 40.1,
          longitude: 29.5,
          animalTypes: ["CAT"],
        }),
      ),
    );
  });
});

