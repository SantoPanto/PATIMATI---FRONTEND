import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const { navigate, requestMock, onAdCreatedMock } = vi.hoisted(() => ({
  navigate: vi.fn(),
  requestMock: vi.fn(),
  onAdCreatedMock: vi.fn(),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/add", navigate],
}));

vi.mock("../components/CreateAdLayout", () => ({
  default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../components/AiAutofillCard", () => ({
  default: ({ onRunAnalysis }: { onRunAnalysis: () => void }) => (
    <button type="button" onClick={onRunAnalysis} data-testid="ai-autofill-btn">
      AI ile doldur
    </button>
  ),
}));

vi.mock("../components/AdCreationMatchModal", () => ({
  default: () => null,
}));

vi.mock("../hooks/useAdMatchingMachine", () => ({
  useAdMatchingMachine: () => ({
    state: "IDLE",
    matches: [],
    errorMessage: null,
    startAdCreation: vi.fn(),
    onAdCreated: onAdCreatedMock,
    reset: vi.fn(),
  }),
}));

vi.mock("../services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/api")>();
  return {
    ...actual,
    request: (...args: unknown[]) => requestMock(...args),
  };
});

vi.mock("../utils/imageCompression", () => ({
  compressImagesWithinLimit: vi.fn(async (dosyalar: File[]) => ({
    accepted: dosyalar,
    stillTooLarge: [],
  })),
}));

if (typeof window !== "undefined" && !window.URL.createObjectURL) {
  window.URL.createObjectURL = () => "blob:test";
}

import AddListingPage from "./AddListingPage";

describe("AddListingPage — Bilgilerin doğruluğunu onaylıyorum (Doğrulama Checkbox)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("doğrulama checkbox'ı ekranda render edilir ve başlangıçta seçili DEĞİLDİR", () => {
    render(<AddListingPage />);

    const checkbox = screen.getByRole("checkbox", {
      name: /Bilgilerin doğruluğunu onaylıyorum/i,
    }) as HTMLInputElement;

    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(false);
  });

  it("checkbox işaretlenmeden form submit edildiğinde validation hatası verir ve POST /api/ads ÇAĞRILMAZ", async () => {
    const { container } = render(<AddListingPage />);

    const file = new File(["dummy content"], "pet.jpg", { type: "image/jpeg" });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Fill required text fields
    fireEvent.change(screen.getByLabelText(/İlan Başlığı/i), {
      target: { value: "Kayıp Tekir" },
    });
    fireEvent.change(screen.getByLabelText(/^Açıklama/i), {
      target: { value: "Sarıyer civarında kayboldu" },
    });
    fireEvent.change(screen.getByPlaceholderText("40.195000"), {
      target: { value: "41.1" },
    });
    fireEvent.change(screen.getByPlaceholderText("29.060000"), {
      target: { value: "29.05" },
    });

    const submitBtn = screen.getByRole("button", { name: /İlanı Yayınla/i });
    await userEvent.click(submitBtn);

    expect(
      await screen.findByText("İlan yayınlamak için bilgilerin doğruluğunu onaylamalısınız."),
    ).toBeInTheDocument();

    expect(requestMock).not.toHaveBeenCalled();
  });

  it("checkbox işaretlendiğinde form başarıyla submit edilir ve POST /api/ads çağrılır", async () => {
    requestMock.mockResolvedValue({ id: 101, title: "Kayıp Tekir" });

    const { container } = render(<AddListingPage />);

    const file = new File(["dummy content"], "pet.jpg", { type: "image/jpeg" });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    fireEvent.change(screen.getByLabelText(/İlan Başlığı/i), {
      target: { value: "Kayıp Tekir" },
    });
    fireEvent.change(screen.getByLabelText(/^Açıklama/i), {
      target: { value: "Sarıyer civarında kayboldu" },
    });
    fireEvent.change(screen.getByPlaceholderText("40.195000"), {
      target: { value: "41.1" },
    });
    fireEvent.change(screen.getByPlaceholderText("29.060000"), {
      target: { value: "29.05" },
    });

    // Check confirmation checkbox
    const checkbox = screen.getByRole("checkbox", {
      name: /Bilgilerin doğruluğunu onaylıyorum/i,
    });
    await userEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", { name: /İlanı Yayınla/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledWith("/api/ads", expect.objectContaining({
        method: "POST",
      }));
    });
    expect(onAdCreatedMock).toHaveBeenCalledWith(101);
  });

  it("AI ile doldur çalıştırıldığında doğrulama checkbox'ı otomatik OLARAK SEÇİLMEZ", async () => {
    requestMock.mockResolvedValue({
      species: "CAT",
      breed: "Tekir",
      isPet: true,
      colors: ["BROWN"],
    });

    render(<AddListingPage />);

    const file = new File(["dummy content"], "pet.jpg", { type: "image/jpeg" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      await userEvent.upload(fileInput, file);
    }

    const aiBtn = screen.getByTestId("ai-autofill-btn");
    await userEvent.click(aiBtn);

    const checkbox = screen.getByRole("checkbox", {
      name: /Bilgilerin doğruluğunu onaylıyorum/i,
    }) as HTMLInputElement;

    expect(checkbox.checked).toBe(false);
  });

  it("afiş izni kutusu render edilir ve varsayılan İŞARETLİDİR (kullanıcı kararı 28.08)", () => {
    render(<AddListingPage />);

    const kutu = screen.getByRole("checkbox", {
      name: /Kayıp afişinin \(PDF\) oluşturulmasına izin veriyorum/i,
    }) as HTMLInputElement;

    expect(kutu).toBeInTheDocument();
    expect(kutu.checked).toBe(true);
  });
});
