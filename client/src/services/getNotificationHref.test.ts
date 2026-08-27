import { describe, expect, it, vi } from "vitest";

// notifications.ts modül yüklenirken firebase/api'ye dokunuyor; test dışarı çıkmasın.
vi.mock("./firebase", () => ({
  getFcmToken: vi.fn().mockResolvedValue(null),
  listenForForegroundMessages: vi.fn(),
}));
vi.mock("./api", () => ({
  request: vi.fn().mockResolvedValue(undefined),
}));

import { getNotificationHref } from "./notifications";
import type { InAppNotification } from "./notifications";

function bildirim(data: Record<string, string>): InAppNotification {
  return {
    id: "1",
    title: "t",
    body: "b",
    read: false,
    data,
  } as unknown as InAppNotification;
}

describe("getNotificationHref", () => {
  it("tipi haritalanmamış ama adId'li bildirim ilan detayına gider (tıklama sessiz kalıyordu)", () => {
    expect(
      getNotificationHref(bildirim({ type: "REPORT_STATUS", adId: "42" })),
    ).toBe("/pet/42");
    expect(getNotificationHref(bildirim({ adId: "7" }))).toBe("/pet/7");
  });

  it("hedefsiz bildirim null döner", () => {
    expect(getNotificationHref(bildirim({ type: "BILGI" }))).toBeNull();
  });

  it("mesaj bildirimi sohbete gider (mevcut davranış korunur)", () => {
    expect(
      getNotificationHref(bildirim({ type: "MESSAGE", referenceId: "5" })),
    ).toBe("/chat/5");
  });
});
