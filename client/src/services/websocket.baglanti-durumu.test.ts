import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * "Bağlanıyor..." yazısı hiç geçmiyor — soket BAĞLI olmasına rağmen.
 *
 * <p><b>Tarayıcıda ölçüldü (24.08, yerel):</b> konsolda `>>> PING` /
 * `<<< PONG` akıyor, karşı kullanıcıdan gönderilen mesaj 2,5 saniyede
 * yenilemesiz ekrana düşüyor — ama başlıkta kalıcı olarak "Bağlanıyor..."
 * yazıyor. Kullanıcı bunu "mesajlar canlı değil" diye okuyor.
 *
 * <p><b>Kök sebep:</b> {@code connectWebSocket} zaten etkin bir istemci
 * bulunca erken dönüyor. O anda istemci HENÜZ BAĞLANMAMIŞSA
 * (active=true, connected=false) yeni çağıranın geri çağrıları hiçbir yere
 * yazılmıyordu; bağlantı sonradan kurulduğunda yalnızca İLK çağıranın
 * `onConnect`'i çalışıyor, o da çoktan unmount olduğu için
 * (`isMounted=false`) durumu güncellemiyordu.
 *
 * <p>Tetikleyen akış: React StrictMode çift mount'u (geliştirme) ve üründe
 * /chat → /chat/{id} geçişi (ChatDetailPage aynı ChatPage'i yeniden mount
 * eder) bağlantı kurulurken.
 */

const { sahteIstemciler } = vi.hoisted(() => ({ sahteIstemciler: [] as any[] }));

vi.mock("@stomp/stompjs", () => {
  class SahteClient {
    active = false;
    connected = false;
    onConnect: ((f: unknown) => void) | undefined;
    onDisconnect: (() => void) | undefined;
    onStompError: ((f: unknown) => void) | undefined;
    onWebSocketError: ((e: unknown) => void) | undefined;
    onWebSocketClose: ((e: unknown) => void) | undefined;
    beforeConnect: (() => void) | undefined;
    constructor(ayar: Record<string, unknown>) {
      Object.assign(this, ayar);
      sahteIstemciler.push(this);
    }
    activate() {
      this.active = true;
    }
    deactivate() {
      this.active = false;
      this.connected = false;
      return Promise.resolve();
    }
    subscribe() {
      return { unsubscribe() {} };
    }
    /** Sunucu bağlantıyı kabul etti — gerçek istemcinin yaptığı çağrı. */
    baglantiyiKur() {
      this.connected = true;
      this.onConnect?.({ headers: {} });
    }
  }
  return { Client: SahteClient };
});

vi.mock("sockjs-client", () => ({ default: class { close() {} } }));

vi.mock("./api", () => ({ API_BASE_URL: "http://yerel", notifyUnauthorized: vi.fn() }));

/** Süresi dolmamış, üç parçalı sahte JWT. */
function jetonUret(): string {
  const govde = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `bas.${govde}.imza`;
}

vi.mock("./auth", () => ({
  getStoredToken: () => jetonUret(),
  clearAuthStorage: vi.fn(),
}));

let websocket: typeof import("./websocket");

beforeEach(async () => {
  sahteIstemciler.length = 0;
  vi.resetModules();
  websocket = await import("./websocket");
});

afterEach(() => {
  websocket.disconnectWebSocket();
});

describe("bağlantı durumu, İKİNCİ çağırana da bildirilir", () => {
  it("istemci BAĞLANMADAN ikinci kez bağlanılırsa, bağlantı kurulunca İKİSİ de haber alır", () => {
    const birinci = { onConnect: vi.fn() };
    const ikinci = { onConnect: vi.fn() };

    websocket.connectWebSocket(undefined, birinci);
    // Aynı anı taklit ediyoruz: istemci active ama HENÜZ connected değil
    // (StrictMode çift mount / sayfa geçişi tam bu aralıkta oluyor).
    expect(sahteIstemciler[0].active).toBe(true);
    expect(sahteIstemciler[0].connected).toBe(false);

    websocket.connectWebSocket(undefined, ikinci);
    expect(sahteIstemciler).toHaveLength(1); // ikinci istemci AÇILMAMALI

    sahteIstemciler[0].baglantiyiKur();

    expect(birinci.onConnect).toHaveBeenCalledTimes(1);
    // Arıza tam buradaydı: ikinci çağıran hiç haber alamıyordu.
    expect(ikinci.onConnect).toHaveBeenCalledTimes(1);
  });

  it("zaten BAĞLIYKEN gelen çağırana anında haber verilir", () => {
    const birinci = { onConnect: vi.fn() };
    websocket.connectWebSocket(undefined, birinci);
    sahteIstemciler[0].baglantiyiKur();

    const gecKalan = { onConnect: vi.fn() };
    websocket.connectWebSocket(undefined, gecKalan);

    expect(gecKalan.onConnect).toHaveBeenCalledTimes(1);
  });

  it("bırakılan geri çağrı artık çağrılmaz", () => {
    const birinci = { onConnect: vi.fn() };
    const ayrilan = { onConnect: vi.fn() };

    websocket.connectWebSocket(undefined, birinci);
    websocket.connectWebSocket(undefined, ayrilan);
    websocket.removeConnectionCallbacks(ayrilan);

    sahteIstemciler[0].baglantiyiKur();

    expect(birinci.onConnect).toHaveBeenCalledTimes(1);
    expect(ayrilan.onConnect).not.toHaveBeenCalled();
  });
});
