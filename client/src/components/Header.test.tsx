import { act, render, screen } from "@testing-library/react";
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

import Header from "./Header";
import {
  clearInAppNotifications,
  markAllNotificationsAsRead,
  recordForegroundNotification,
} from "../services/notifications";

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
    render(<Header />);

    expect(
      screen.getByLabelText("Bildirimleri görüntüle"),
    ).toBeInTheDocument();
    expect(noktayiBul()).toBeNull();
  });

  it("okunmamis bildirim gelince nokta yanar", () => {
    render(<Header />);

    act(() => {
      okunmamisBildirimEkle();
    });

    expect(noktayiBul()).not.toBeNull();
  });

  it('"tumunu okundu say" sonrasi nokta SONER (canlida yanik kaliyordu)', () => {
    act(() => {
      okunmamisBildirimEkle();
    });

    render(<Header />);
    expect(noktayiBul()).not.toBeNull();

    act(() => {
      markAllNotificationsAsRead();
    });

    expect(noktayiBul()).toBeNull();
  });
});
