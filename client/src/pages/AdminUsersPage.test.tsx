import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserDetailForAdminDTO } from "../services/types";

/**
 * "Kuruma yükselt" akışı (belediye modülü, B parçası) — telde giden alan
 * adlarının bekçisi.
 *
 * <p><b>Neden:</b> kurum hesabı serbest kayıtla açılmıyor; tek kapı bu ekran.
 * BE {@code InstitutionAssignmentRequest} üç alanı da {@code @NotBlank} ile
 * istiyor — alan adı kayarsa istek 400 döner ve ilk kurum hesabı yine ancak
 * curl ile açılabilir hâle geri düşer.
 */

const { kullanicilariGetir, kurumaYukselt } = vi.hoisted(() => ({
  kullanicilariGetir: vi.fn(),
  kurumaYukselt: vi.fn(),
}));

vi.mock("../services/admin", async (gercegi) => ({
  ...(await gercegi<typeof import("../services/admin")>()),
  getAdminUsers: kullanicilariGetir,
  assignInstitution: kurumaYukselt,
}));

import AdminUsersPage from "./AdminUsersPage";

function kullanici(
  ek: Partial<UserDetailForAdminDTO> = {},
): UserDetailForAdminDTO {
  return {
    uid: 5,
    email: "nilufer@belediye.gov.tr",
    firstName: "Nilüfer",
    lastName: "Belediyesi",
    role: "USER",
    phone: "",
    enabled: true,
    latitude: null,
    longitude: null,
    lostPoints: 0,
    adoptionPoints: 0,
    lostBadgeLevel: 0,
    adoptionBadgeLevel: 0,
    banned: false,
    createdAt: "2026-08-01T10:00:00",
    ...ek,
  };
}

function sayfa(kullanicilar: UserDetailForAdminDTO[]) {
  return {
    content: kullanicilar,
    totalElements: kullanicilar.length,
    totalPages: 1,
    number: 0,
    size: 50,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  kullanicilariGetir.mockResolvedValue(sayfa([kullanici()]));
});

describe("AdminUsersPage kuruma yükseltme", () => {
  it("düğme sıradan kullanıcıda var, kurum hesabında YOK", async () => {
    kullanicilariGetir.mockResolvedValue(
      sayfa([
        kullanici(),
        kullanici({
          uid: 6,
          role: "INSTITUTION",
          email: "osmangazi@belediye.gov.tr",
        }),
      ]),
    );

    render(<AdminUsersPage />);

    expect(
      await screen.findAllByRole("button", { name: /Kuruma yükselt/ }),
    ).toHaveLength(1);
  });

  it("formu doldurup gönderince BE'nin beklediği alan adlarıyla PUT atar", async () => {
    kurumaYukselt.mockResolvedValue({
      message: "Kullanıcı 5 kurum hesabı olarak tanımlandı: Nilüfer",
    });

    render(<AdminUsersPage />);
    await userEvent.click(
      await screen.findByRole("button", { name: /Kuruma yükselt/ }),
    );

    await userEvent.type(screen.getByLabelText("Kurum adı"), "Nilüfer Belediyesi");
    await userEvent.type(screen.getByLabelText("İl"), "Bursa");
    await userEvent.type(screen.getByLabelText("İlçe"), "Nilüfer");
    await userEvent.click(screen.getByRole("button", { name: "Yükselt" }));

    await waitFor(() =>
      expect(kurumaYukselt).toHaveBeenCalledWith(5, {
        institutionName: "Nilüfer Belediyesi",
        institutionCity: "Bursa",
        institutionDistrict: "Nilüfer",
      }),
    );
  });

  it("başarıda yeniden giriş uyarısını gösterir ve listeyi tazeler", async () => {
    kurumaYukselt.mockResolvedValue({
      message: "Kullanıcı 5 kurum hesabı olarak tanımlandı: Nilüfer",
    });

    render(<AdminUsersPage />);
    await userEvent.click(
      await screen.findByRole("button", { name: /Kuruma yükselt/ }),
    );
    await userEvent.type(screen.getByLabelText("Kurum adı"), "Nilüfer Belediyesi");
    await userEvent.type(screen.getByLabelText("İl"), "Bursa");
    await userEvent.type(screen.getByLabelText("İlçe"), "Nilüfer");
    await userEvent.click(screen.getByRole("button", { name: "Yükselt" }));

    expect(
      await screen.findByText(/yeniden giriş yapması gerekir/),
    ).toBeInTheDocument();
    // Rol değişti — kartlardaki rol rozeti tazelenmeli.
    await waitFor(() =>
      expect(kullanicilariGetir.mock.calls.length).toBeGreaterThan(1),
    );
  });
});
