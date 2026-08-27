import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * VetDetailPage -- salt-okunur harita (istek #1) + puan özeti (istek #3),
 * plan §14/§B.5.
 *
 * <p>Gerçek Leaflet/jsdom ağır olduğundan `MapPicker` test-id'li bir stub'a
 * indirgeniyor. `VetClinicReviewsSection` ayrı bir bileşen olarak zaten
 * kendi testinde ölçülüyor -- burada yalnızca doğru `clinicId` ile
 * render edildiği doğrulanır.
 */

const { navigate, oturum, getVetClinic, getMyRequestStatus } = vi.hoisted(() => ({
  navigate: vi.fn(),
  oturum: { isAuthenticated: false },
  getVetClinic: vi.fn(),
  getMyRequestStatus: vi.fn(),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/hizmetler/veteriner/9", navigate] as const,
  useParams: () => ({ id: "9" }),
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => oturum,
}));

vi.mock("../services/vet", () => ({ getVetClinic }));
vi.mock("../services/vetCustomers", () => ({
  getMyRequestStatus,
  sendVetCustomerRequest: vi.fn(),
}));

vi.mock("../components/Header", () => ({ default: () => <header /> }));
vi.mock("../components/Footer", () => ({ default: () => <footer /> }));

vi.mock("../components/MapPicker", () => ({
  default: ({ latitude, longitude, readOnly }: { latitude?: number | null; longitude?: number | null; readOnly?: boolean }) => (
    <div data-testid="map-picker-stub" data-readonly={readOnly ? "true" : "false"}>
      {latitude}, {longitude}
    </div>
  ),
}));

vi.mock("../components/VetClinicReviewsSection", () => ({
  default: ({ clinicId }: { clinicId: number }) => (
    <div data-testid="vet-reviews-section-stub">clinicId:{clinicId}</div>
  ),
}));

import VetDetailPage from "./VetDetailPage";

const KLINIK_TEMEL = {
  id: 9,
  vetUserId: 55,
  name: "Pati Veteriner Kliniği",
  address: "Örnek Mah.",
  city: "Ankara",
  district: "Çankaya",
  phone: "0312 000 00 00",
  workingHours: "Hafta içi 09:00 - 18:00",
  photoUrl: null,
  latitude: null as number | null,
  longitude: null as number | null,
  animalTypes: [] as string[],
  averageRating: null as number | null,
  reviewCount: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  oturum.isAuthenticated = false;
  getMyRequestStatus.mockResolvedValue(null);
});

describe("VetDetailPage — konum", () => {
  it("konumlu klinikte MapPicker readOnly render edilir", async () => {
    getVetClinic.mockResolvedValue({ ...KLINIK_TEMEL, latitude: 40.1, longitude: 29.5 });

    render(<VetDetailPage />);

    const map = await screen.findByTestId("map-picker-stub");
    expect(map).toHaveAttribute("data-readonly", "true");
    expect(map).toHaveTextContent("40.1, 29.5");
  });

  it("konumsuz klinikte harita hiç render edilmez", async () => {
    getVetClinic.mockResolvedValue({ ...KLINIK_TEMEL, latitude: null, longitude: null });

    render(<VetDetailPage />);

    await waitFor(() => expect(getVetClinic).toHaveBeenCalled());
    await screen.findByText("Pati Veteriner Kliniği");
    expect(screen.queryByTestId("map-picker-stub")).toBeNull();
  });
});

describe("VetDetailPage — puan özeti", () => {
  it("reviewCount:0 iken \"Henüz değerlendirme yok\" yazar", async () => {
    getVetClinic.mockResolvedValue({ ...KLINIK_TEMEL, averageRating: null, reviewCount: 0 });

    render(<VetDetailPage />);

    expect(await screen.findByText(/Henüz değerlendirme yok/)).toBeInTheDocument();
  });

  it("dolu puanda \"4.6 (12)\" biçiminde metin görünür", async () => {
    getVetClinic.mockResolvedValue({ ...KLINIK_TEMEL, averageRating: 4.6, reviewCount: 12 });

    render(<VetDetailPage />);

    expect(await screen.findByText(/4[.,]6 \(12\)/)).toBeInTheDocument();
  });

  it("VetClinicReviewsSection doğru clinicId ile render edilir", async () => {
    getVetClinic.mockResolvedValue({ ...KLINIK_TEMEL, averageRating: 4.6, reviewCount: 12 });

    render(<VetDetailPage />);

    expect(await screen.findByTestId("vet-reviews-section-stub")).toHaveTextContent("clinicId:9");
  });
});
