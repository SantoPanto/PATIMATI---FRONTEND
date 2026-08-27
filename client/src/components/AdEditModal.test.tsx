import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdEditModal from "./AdEditModal";
import { updateAd } from "../services/ads";
import type { AdResponse } from "../services/types";

// Afiş formu kendi veri çağrılarını yapıyor; bu testin konusu değil.
vi.mock("./PosterSettingsForm", () => ({ default: () => null }));
vi.mock("../services/ads", () => ({ updateAd: vi.fn() }));

const ornekIlan = {
  id: 7,
  title: "Sahiplendirilecek kedi Duman",
  description: "Gri tekir, ürkek, kucak kedisi.",
  adType: "ADOPTION", // tam düzenleme formu yalnız sahiplendirme ilanında açılıyor
  species: "CAT",
  breed: "Scottish Fold",
  gender: "FEMALE",
  ageGroup: "YOUNG",
  coatPattern: "STRIPED",
  eyeColor: "GREEN",
  microchipNumber: "",
  colors: ["WHITE"],
  collarStatus: "UNKNOWN",
  collarColor: null,
  collarTagText: "",
  distinctiveMarks: "",
  latitude: 40.225811,
  longitude: 28.91593,
} as unknown as AdResponse;

function modalAc() {
  return render(
    <AdEditModal
      isOpen={true}
      onClose={vi.fn()}
      ad={ornekIlan}
      onSuccess={vi.fn()}
    />,
  );
}

describe("AdEditModal — güncelleme sözleşmesi bekçileri", () => {
  beforeEach(() => {
    vi.mocked(updateAd).mockReset();
    vi.mocked(updateAd).mockResolvedValue(ornekIlan);
  });

  it("gönderilen paket adType'ı mevcut ilan türüyle içerir (sunucu alanı zorunlu tutuyor; eksikse her düzenleme 400 düşer)", async () => {
    modalAc();

    fireEvent.click(screen.getByRole("button", { name: /İlanı Güncelle/ }));

    await waitFor(() => expect(updateAd).toHaveBeenCalledTimes(1));
    const [ilanId, paket] = vi.mocked(updateAd).mock.calls[0];
    expect(ilanId).toBe(7);
    expect(paket.adType).toBe("ADOPTION");
    expect(paket.latitude).toBe(40.225811);
    expect(paket.longitude).toBe(28.91593);
  });

  it("göz rengi serbest metin değil enum listesinden seçilir ve pakete enum adı gider (sunucu EyeColor enum bekliyor)", async () => {
    modalAc();

    expect(screen.queryByPlaceholderText("Örn: Yeşil, Mavi")).toBeNull();

    const gozRengiSecimi = screen.getByDisplayValue("Yeşil");
    fireEvent.change(gozRengiSecimi, { target: { value: "AMBER" } });

    fireEvent.click(screen.getByRole("button", { name: /İlanı Güncelle/ }));

    await waitFor(() => expect(updateAd).toHaveBeenCalledTimes(1));
    const [, paket] = vi.mocked(updateAd).mock.calls[0];
    expect(paket.eyeColor).toBe("AMBER");
  });
});
