import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ServicesPage -- Header'daki "Hizmetler" ikonu artık doğrudan bu sayfaya
 * götürüyor. İlanlar sayfasındaki (listingpage.tsx) Tümü/Kayıp/Bulunan/
 * Sahiplendirme filtre-sekmesi deseniyle aynı: burada Tümü/Veteriner/
 * Petshop/Barınak.
 */

const { listVetClinicsMock, listPetShopsMock, listSheltersMock } = vi.hoisted(() => ({
  listVetClinicsMock: vi.fn(),
  listPetShopsMock: vi.fn(),
  listSheltersMock: vi.fn(),
}));

vi.mock("../services/vet", () => ({ listVetClinics: listVetClinicsMock }));
vi.mock("../services/petshop", () => ({ listPetShops: listPetShopsMock }));
vi.mock("../services/shelter", () => ({ listShelters: listSheltersMock }));

vi.mock("wouter", () => ({
  Link: ({ children, href }: { children?: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("../components/Header", () => ({ default: () => <header /> }));
vi.mock("../components/Footer", () => ({ default: () => <footer /> }));

// #175 sayfaya useAuth + kendi-başvurum sorgusunu ekledi; test AuthProvider'sız
// render ettiği için 6 vaka birden düşüyordu (27.08 main CI kırmızısı).
// Girişsiz varsayılan: efekt erken döner, CTA "başvurabilir" hâliyle çizilir.
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, isAuthenticated: false }),
}));
vi.mock("../services/businessApplications", () => ({
  getMyBusinessApplication: vi.fn().mockResolvedValue(null),
}));

import ServicesPage from "./ServicesPage";

const emptyPage = { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0, first: true, last: true, empty: true };

function pageOf(content: unknown[]) {
  return { ...emptyPage, content, totalElements: content.length, empty: content.length === 0 };
}

async function flush() {
  await act(async () => {});
}

beforeEach(() => {
  listVetClinicsMock.mockReset();
  listPetShopsMock.mockReset();
  listSheltersMock.mockReset();
});

describe("ServicesPage", () => {
  it("Tümü seçiliyken üç kaynaktan da veri çekip birleştirir", async () => {
    listVetClinicsMock.mockResolvedValue(
      pageOf([{ id: 1, name: "Pati Veteriner", address: "Adres", city: "Ankara", district: null, phone: "0500", workingHours: null, photoUrl: null, latitude: null, longitude: null, animalTypes: [], averageRating: 4.5, reviewCount: 2 }]),
    );
    listPetShopsMock.mockResolvedValue(
      pageOf([{ id: 2, name: "Pati Petshop", address: "Adres", city: "Ankara", district: null, phone: "0500", workingHours: null, photoUrl: null, latitude: null, longitude: null }]),
    );
    listSheltersMock.mockResolvedValue(
      pageOf([{ id: 3, name: "Pati Barınağı", address: "Adres", city: "Ankara", district: null, phone: "0500", workingHours: null, photoUrl: null, latitude: null, longitude: null, averageRating: null, reviewCount: 0 }]),
    );

    render(<ServicesPage />);
    await flush();

    expect(screen.getByText("Pati Veteriner")).toBeTruthy();
    expect(screen.getByText("Pati Petshop")).toBeTruthy();
    expect(screen.getByText("Pati Barınağı")).toBeTruthy();
  });

  it("Veteriner sekmesine tıklayınca yalnızca listVetClinics çağrılır", async () => {
    listVetClinicsMock.mockResolvedValue(pageOf([]));
    listPetShopsMock.mockResolvedValue(pageOf([]));
    listSheltersMock.mockResolvedValue(pageOf([]));

    render(<ServicesPage />);
    await flush();

    listVetClinicsMock.mockClear();
    listPetShopsMock.mockClear();
    listSheltersMock.mockClear();

    fireEvent.click(screen.getByRole("tab", { name: "Veteriner" }));
    await flush();

    expect(listVetClinicsMock).toHaveBeenCalled();
    expect(listPetShopsMock).not.toHaveBeenCalled();
    expect(listSheltersMock).not.toHaveBeenCalled();
  });

  it("kart tıklaması doğru hizmet türünün detay rotasına gider", async () => {
    listVetClinicsMock.mockResolvedValue(
      pageOf([{ id: 7, name: "Pati Veteriner", address: "Adres", city: "Ankara", district: null, phone: "0500", workingHours: null, photoUrl: null, latitude: null, longitude: null, animalTypes: [], averageRating: null, reviewCount: 0 }]),
    );
    listPetShopsMock.mockResolvedValue(pageOf([]));
    listSheltersMock.mockResolvedValue(pageOf([]));

    render(<ServicesPage />);
    await flush();

    const link = screen.getByText("Pati Veteriner").closest("a");
    expect(link).toHaveAttribute("href", "/hizmetler/veteriner/7");
  });

  it("hiçbir sonuç yokken boş durum mesajı gösterir", async () => {
    listVetClinicsMock.mockResolvedValue(pageOf([]));
    listPetShopsMock.mockResolvedValue(pageOf([]));
    listSheltersMock.mockResolvedValue(pageOf([]));

    render(<ServicesPage />);
    await flush();

    expect(screen.getByText("Bu kategoride kayıtlı bir hizmet yok.")).toBeTruthy();
  });

  it("veteriner kartında hayvan türü rozetleri ve puan gösterilir", async () => {
    listVetClinicsMock.mockResolvedValue(
      pageOf([{ id: 9, name: "Pati Veteriner", address: "Adres", city: "Ankara", district: null, phone: "0500", workingHours: null, photoUrl: null, latitude: null, longitude: null, animalTypes: ["CAT", "DOG"], averageRating: 4.5, reviewCount: 3 }]),
    );
    listPetShopsMock.mockResolvedValue(pageOf([]));
    listSheltersMock.mockResolvedValue(pageOf([]));

    render(<ServicesPage />);
    await flush();

    expect(screen.getByText("Kedi")).toBeTruthy();
    expect(screen.getByText("Köpek")).toBeTruthy();
    expect(screen.getByText(/4\.5/)).toBeTruthy();
  });

  it("puanı olmayan veteriner/petshop/barınak kartlarının HEPSİNDE 'Henüz değerlendirme yok' yazar", async () => {
    listVetClinicsMock.mockResolvedValue(
      pageOf([{ id: 10, name: "Puansız Veteriner", address: "Adres", city: "Ankara", district: null, phone: "0500", workingHours: null, photoUrl: null, latitude: null, longitude: null, animalTypes: [], averageRating: null, reviewCount: 0 }]),
    );
    listPetShopsMock.mockResolvedValue(
      pageOf([{ id: 11, name: "Bir Petshop", address: "Adres", city: "Ankara", district: null, phone: "0500", workingHours: null, photoUrl: null, latitude: null, longitude: null, averageRating: null, reviewCount: 0 }]),
    );
    listSheltersMock.mockResolvedValue(
      pageOf([{ id: 12, name: "Bir Barınak", address: "Adres", city: "Ankara", district: null, phone: "0500", workingHours: null, photoUrl: null, latitude: null, longitude: null, averageRating: null, reviewCount: 0 }]),
    );

    render(<ServicesPage />);
    await flush();

    expect(screen.getAllByText("Henüz değerlendirme yok")).toHaveLength(3);
  });

  it("girişsiz ziyaretçi için işletme başvurusu CTA'sı görünür ve forma bağlanır", async () => {
    listVetClinicsMock.mockResolvedValue(pageOf([]));
    listPetShopsMock.mockResolvedValue(pageOf([]));
    listSheltersMock.mockResolvedValue(pageOf([]));

    render(<ServicesPage />);
    await flush();

    expect(screen.getByText("İşletme sahibi misiniz?")).toBeTruthy();
    const basvuruLinki = document.querySelector(
      'a[href="/hizmetler/isletme-basvurusu"]',
    );
    expect(basvuruLinki).not.toBeNull();
  });
});
