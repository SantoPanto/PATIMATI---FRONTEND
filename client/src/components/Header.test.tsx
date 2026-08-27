import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Zil noktasinin CALISMA ANI davranisi.
 *
 * <p><b>Neden bu dosya var:</b> canli testte (22.08) "tumunu okundu say"
 * sonrasinda bile zilin ustundeki nokta yanik kaldi — nokta kosulsuz
 * ciziliyordu, okunmamis bildirime hic bakmiyordu. `tsc` bu sinifi goremez:
 * kosulsuz <span> ile kosullu <span> ayni tiptedir.
 *
 * <p><b>Neden bildirim deposu SAHTELENMEDI:</b> gercek store kullaniliyor
 * (recordForegroundNotification / markAllNotificationsAsRead). Sahtelenseydi
 * "nokta okunmamisa bagli" iddiasi yalnizca Header'in bir boolean okudugunu
 * kanitlardi; depo degisince Header'in YENIDEN cizildigini (abonelik
 * zinciri) kanitlamazdi. Sahtelenen yalniz dis dunya: HTTP ve Firebase.
 */

const { navigate, oturum } = vi.hoisted(() => ({
  navigate: vi.fn(),
  oturum: {
    user: null as { role: string } | null,
    isAuthenticated: true,
    logout: vi.fn(),
  },
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/", navigate] as const,
  Link: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => oturum,
}));

// Okundu isaretleme sunucuya PUT atar; testte HTTP disari cikmasin.
vi.mock("../services/api", () => ({
  request: vi.fn().mockResolvedValue(undefined),
}));

// firebase.ts modul yuklenirken initializeApp cagiriyor; testte gereksiz.
vi.mock("../services/firebase", () => ({
  getFcmToken: vi.fn().mockResolvedValue(null),
  listenForForegroundMessages: vi.fn(),
}));

// Mesaj rozeti sayiyi bu servisten okur; testte HTTP disari cikmasin.
vi.mock("../services/messages", () => ({
  getUnreadMessageCount: vi.fn().mockResolvedValue(0),
}));

import Header from "./Header";
import { ThemeProvider } from "../contexts/ThemeContext";
import {
  clearInAppNotifications,
  markAllNotificationsAsRead,
  recordForegroundNotification,
} from "../services/notifications";
import { getUnreadMessageCount } from "../services/messages";

function renderHeader() {
  return render(
    <ThemeProvider>
      <Header />
    </ThemeProvider>,
  );
}

function noktayiBul(): Element | null {
  return document.querySelector(".notification-dot");
}

function okunmamisBildirimEkle(): void {
  recordForegroundNotification({
    title: "Eşleşme",
    body: "Olası bir eşleşme bulundu.",
    data: {},
  });
}

beforeEach(() => {
  clearInAppNotifications();
  navigate.mockClear();
  oturum.isAuthenticated = true;
  oturum.user = null;
});

describe("Header zil noktası", () => {
  it("hic bildirim yokken nokta CIZILMEZ", () => {
    renderHeader();

    expect(
      screen.getByLabelText("Bildirimleri görüntüle"),
    ).toBeInTheDocument();
    expect(noktayiBul()).toBeNull();
  });

  it("okunmamis bildirim gelince nokta yanar", () => {
    renderHeader();

    act(() => {
      okunmamisBildirimEkle();
    });

    expect(noktayiBul()).not.toBeNull();
  });

  it('"tumunu okundu say" sonrasi nokta SONER (canlida yanik kaliyordu)', () => {
    act(() => {
      okunmamisBildirimEkle();
    });

    renderHeader();
    expect(noktayiBul()).not.toBeNull();

    act(() => {
      markAllNotificationsAsRead();
    });

    expect(noktayiBul()).toBeNull();
  });
});

/**
 * Rol bazlı panel kısayol linkleri -- VET/ADMIN için zaten vardı, ancak
 * PETSHOP ve BARINAK rolleri eklenirken bu linkler hiç eklenmemişti (canlı
 * testte fark edildi: petshop hesabıyla girişte "Petshop Paneli" butonu
 * görünmüyordu). Her rol yalnızca KENDİ linkini görmeli, başkasının linkini
 * DEĞİL.
 */
describe("Header rol bazlı panel linki", () => {
  it("PETSHOP rolünde 'Petshop Paneli' linki görünür, diğerleri görünmez", () => {
    oturum.user = { role: "PETSHOP" };
    renderHeader();

    expect(screen.getByLabelText("Petshop Paneli")).toBeInTheDocument();
    expect(screen.queryByLabelText("Veteriner Paneli")).toBeNull();
    expect(screen.queryByLabelText("Barınak Paneli")).toBeNull();
    expect(screen.queryByLabelText("Yönetim Paneli")).toBeNull();
  });

  it("BARINAK rolünde 'Barınak Paneli' linki görünür, diğerleri görünmez", () => {
    oturum.user = { role: "BARINAK" };
    renderHeader();

    expect(screen.getByLabelText("Barınak Paneli")).toBeInTheDocument();
    expect(screen.queryByLabelText("Veteriner Paneli")).toBeNull();
    expect(screen.queryByLabelText("Petshop Paneli")).toBeNull();
  });

  it("VET rolünde 'Veteriner Paneli' linki görünür (regresyon)", () => {
    oturum.user = { role: "VET" };
    renderHeader();

    expect(screen.getByLabelText("Veteriner Paneli")).toBeInTheDocument();
    expect(screen.queryByLabelText("Petshop Paneli")).toBeNull();
    expect(screen.queryByLabelText("Barınak Paneli")).toBeNull();
  });

  it("USER rolünde hiçbir panel linki görünmez", () => {
    oturum.user = { role: "USER" };
    renderHeader();

    expect(screen.queryByLabelText("Veteriner Paneli")).toBeNull();
    expect(screen.queryByLabelText("Petshop Paneli")).toBeNull();
    expect(screen.queryByLabelText("Barınak Paneli")).toBeNull();
    expect(screen.queryByLabelText("Yönetim Paneli")).toBeNull();
  });
});

/**
 * Belediye modulu linkleri. /municipality ve /report uzun sure YALNIZ adres
 * yazilarak acilabiliyordu — rota vardi, uygulamada gorunur giris yoktu.
 * Bu blok o girislerin varligini kilitler.
 */
describe("Header belediye linkleri", () => {
  it("kurum hesabinda Belediye Paneli rozeti gorunur", () => {
    oturum.user = { role: "INSTITUTION" };
    renderHeader();

    const rozet = screen.getByLabelText("Belediye Paneli");
    expect(rozet).toHaveAttribute("href", "/municipality");
  });

  it("siradan kullanicida Belediye Paneli rozeti YOK", () => {
    oturum.user = { role: "USER" };
    renderHeader();

    expect(screen.queryByLabelText("Belediye Paneli")).toBeNull();
  });

  it("yonetici de Belediye Paneli rozetini gorur (27.08 istegi: denetleyici gorunum)", () => {
    oturum.user = { role: "ADMIN" };
    renderHeader();

    expect(screen.getByLabelText("Belediye Paneli")).toHaveAttribute(
      "href",
      "/municipality",
    );
    // Admin'in kendi rozeti de duruyor — ikisi bir arada.
    expect(screen.getByLabelText("Yönetim Paneli")).toBeInTheDocument();
  });

  it("Ihbar Et navigasyon linki girissiz de gorunur ve /report'a gider", () => {
    oturum.isAuthenticated = false;
    oturum.user = null;
    renderHeader();

    expect(screen.getByText("İhbar Et")).toHaveAttribute("href", "/report");
  });
});

describe("Header sadeleştirilmiş navigasyon ve İlanlar açılır menüsü", () => {
  it("navigasyon menüsünde ayrı 'Ana Sayfa' linki YOKTUR, logo ana sayfaya gider", () => {
    renderHeader();

    const logo = screen.getByLabelText("PATIMATI ana sayfa");
    expect(logo).toHaveAttribute("href", "/");

    const nav = screen.getByRole("navigation", { name: "Ana navigasyon" });
    expect(nav).not.toHaveTextContent("Ana Sayfa");
  });

  it("navigasyon menüsünde ayrı üst seviye 'Sahiplendirme' butonu YOKTUR", () => {
    renderHeader();

    const nav = screen.getByRole("navigation", { name: "Ana navigasyon" });
    const directSahiplendirmeLink = Array.from(nav.querySelectorAll("a")).find(
      (a) => a.textContent?.trim() === "Sahiplendirme"
    );
    expect(directSahiplendirmeLink).toBeUndefined();
  });

  it("İlanlar açılır menüsü 4 ilan türünü doğru linklerle sunar", () => {
    renderHeader();

    const dropdownTrigger = screen.getByLabelText("İlan türleri menüsünü aç");
    expect(dropdownTrigger).toBeInTheDocument();

    act(() => {
      dropdownTrigger.click();
    });

    expect(screen.getByText("Kayıp İlanı").closest("a")).toHaveAttribute(
      "href",
      "/listings?type=LOST"
    );
    expect(screen.getByText("Bulundu İlanı").closest("a")).toHaveAttribute(
      "href",
      "/listings?type=FOUND"
    );
    expect(screen.getByText("Sahiplendirme İlanı").closest("a")).toHaveAttribute(
      "href",
      "/listings?type=ADOPTION"
    );
    expect(screen.getByText("Yardım İlanı").closest("a")).toHaveAttribute(
      "href",
      "/listings?type=HELP"
    );
  });
});

describe("Header mesaj rozeti", () => {
  it("okunmamis mesaj varken sohbet simgesinde nokta yanar", async () => {
    vi.mocked(getUnreadMessageCount).mockResolvedValue(3);

    renderHeader();

    const sohbet = screen.getByLabelText("Mesajları görüntüle");
    await waitFor(() => {
      expect(sohbet.querySelector(".notification-dot")).not.toBeNull();
    });
  });

  it("okunmamis mesaj yokken sohbet simgesinde nokta cizilmez", async () => {
    vi.mocked(getUnreadMessageCount).mockResolvedValue(0);

    renderHeader();

    await waitFor(() => {
      expect(vi.mocked(getUnreadMessageCount)).toHaveBeenCalled();
    });
    const sohbet = screen.getByLabelText("Mesajları görüntüle");
    expect(sohbet.querySelector(".notification-dot")).toBeNull();
  });
});
