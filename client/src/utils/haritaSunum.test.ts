import { describe, expect, it } from "vitest";
import type { AdType, PoiType } from "../services/types";
import {
  adLejantKalemleri,
  getMarkerType,
  getPoiMarkerType,
  haritadaGorunur,
  haritaOdagi,
  poiDetailPath,
  poiGorunur,
  poiLejantKalemleri,
  VARSAYILAN_MERKEZ,
} from "./haritaSunum";

/*
 * 22.08 saha geri bildirimi: "filtreye basınca haritada bir şey değişmiyor".
 * Kök sebep iki katmandı: işaretçiler tek renkti (className canlıda SVG
 * path'e ulaşmıyordu) + görünüm kalan işaretçilere odaklanmıyordu (Bursa
 * kadraj dışında kalıyordu). Bu testler renk/odak sözleşmesini kilitler.
 */
describe("getMarkerType", () => {
  it("dört ilan tipi dört AYRI dolgu rengi taşır", () => {
    const tipler: AdType[] = ["LOST", "FOUND", "ADOPTION", "HELP"];
    const renkler = tipler.map((tip) => getMarkerType(tip).fillColor);

    expect(new Set(renkler).size).toBe(4);
    renkler.forEach((renk) => expect(renk).toMatch(/^#[0-9a-f]{6}$/i));
  });

  it("etiketler Türkçe", () => {
    expect(getMarkerType("LOST").label).toBe("Kayıp");
    expect(getMarkerType("FOUND").label).toBe("Bulunan");
    expect(getMarkerType("ADOPTION").label).toBe("Sahiplendirme");
    expect(getMarkerType("HELP").label).toBe("Yardım");
  });
});

describe("haritaOdagi", () => {
  const nokta1: [number, number] = [39.93, 32.85]; // Ankara
  const nokta2: [number, number] = [40.19, 29.06]; // Bursa

  it("seçili ilan varsa ona yaklaşır", () => {
    const odak = haritaOdagi(nokta1, [nokta1, nokta2]);

    expect(odak).toEqual({ tip: "nokta", nokta: nokta1, yakinlik: 13 });
  });

  it("seçili yoksa kalan işaretçilerin TÜMÜNÜ kadraja alır", () => {
    const odak = haritaOdagi(null, [nokta1, nokta2]);

    expect(odak.tip).toBe("sinir");
    if (odak.tip === "sinir") {
      expect(odak.noktalar).toHaveLength(2);
      expect(odak.noktalar).toContain(nokta2);
    }
  });

  it("hiç işaretçi yoksa varsayılan merkeze döner", () => {
    const odak = haritaOdagi(null, []);

    expect(odak).toEqual({
      tip: "varsayilan",
      nokta: VARSAYILAN_MERKEZ,
      yakinlik: 12,
    });
  });

  it("seçili ilan yoksa ve konum biliniyorsa ilan sınırından ÖNCE konuma yaklaşır", () => {
    const konum: [number, number] = [40.85, 29.88]; // Kocaeli

    const odak = haritaOdagi(null, [nokta1, nokta2], konum);

    expect(odak).toEqual({ tip: "nokta", nokta: konum, yakinlik: 14 });
  });

  it("konum yoksa (null/undefined) eskisi gibi ilanları kadraja alır", () => {
    expect(haritaOdagi(null, [nokta1, nokta2], null).tip).toBe("sinir");
    expect(haritaOdagi(null, [nokta1, nokta2]).tip).toBe("sinir");
  });
});

/*
 * 22.08 mobil taraması: sahiplendirme işaretçileri haritada çizilip lejantta
 * yer aldığı hâlde süzgeçte Sahiplendirme SEÇENEĞİ yoktu. Bu blok, üç ilan
 * tipinin de tek başına süzülebildiğini ve aramanın süzgeçle BİRLİKTE
 * çalıştığını kilitler.
 */
describe("haritadaGorunur", () => {
  const ilan = (
    adType: AdType,
    title = "",
    breed = "",
  ) => ({ adType, title, breed, species: "CAT" as const });

  it("ALL her üç tipi de geçirir", () => {
    const tipler: AdType[] = ["LOST", "FOUND", "ADOPTION"];

    tipler.forEach((tip) => {
      expect(haritadaGorunur(ilan(tip), "ALL", "")).toBe(true);
    });
  });

  it("ADOPTION seçiliyken yalnız sahiplendirme kalır", () => {
    expect(haritadaGorunur(ilan("ADOPTION"), "ADOPTION", "")).toBe(true);
    expect(haritadaGorunur(ilan("LOST"), "ADOPTION", "")).toBe(false);
    expect(haritadaGorunur(ilan("FOUND"), "ADOPTION", "")).toBe(false);
  });

  it("arama başlık, cins veya tür etiketi üzerinden — süzgeçle birlikte", () => {
    const tekir = ilan("ADOPTION", "Sevimli dost", "Tekir");

    // Cins eşleşiyor + tip uyuyor.
    expect(haritadaGorunur(tekir, "ADOPTION", "tekir")).toBe(true);
    // Tür etiketi ("Kedi") Türkçe küçük-büyük duyarsız eşleşir.
    expect(haritadaGorunur(tekir, "ALL", "KEDİ")).toBe(true);
    // Arama tutuyor ama tip uymuyor — süzgeç önce gelir.
    expect(haritadaGorunur(tekir, "LOST", "tekir")).toBe(false);
    // Hiçbir alan tutmuyor.
    expect(haritadaGorunur(tekir, "ALL", "papağan")).toBe(false);
  });
});

/*
 * 26.08 talebi: hizmet süzgeci artık bağımsız aç/kapa çip değil, ilan
 * süzgeciyle AYNI Tümü|tek-tip mantığında çalışıyor.
 */
describe("poiGorunur", () => {
  it("ALL üç tipi de geçirir", () => {
    const tipler: PoiType[] = ["VETERINARY", "PET_SHOP", "SHELTER"];

    tipler.forEach((tip) => {
      expect(poiGorunur({ type: tip }, "ALL")).toBe(true);
    });
  });

  it("tek tip seçiliyken yalnız o tip kalır", () => {
    expect(poiGorunur({ type: "VETERINARY" }, "VETERINARY")).toBe(true);
    expect(poiGorunur({ type: "PET_SHOP" }, "VETERINARY")).toBe(false);
    expect(poiGorunur({ type: "SHELTER" }, "VETERINARY")).toBe(false);
  });
});

/*
 * 26.08 talebi: sağ alt lejant artık sabit değil, o an açık olan
 * ilan/hizmet süzgeçlerine göre üretiliyor — "sadece kayıp açınca sağ
 * altta sadece kayıp yazsın".
 */
describe("adLejantKalemleri / poiLejantKalemleri", () => {
  it("ilan süzgeci ALL iken dört kalem de döner", () => {
    expect(adLejantKalemleri("ALL")).toHaveLength(4);
  });

  it("ilan süzgeci tek tipe daralınca lejant da daralır", () => {
    const kalemler = adLejantKalemleri("LOST");

    expect(kalemler).toEqual([
      { label: "Kayıp", color: getMarkerType("LOST").fillColor },
    ]);
  });

  it("hizmet süzgeci ALL iken üç kalem de döner", () => {
    expect(poiLejantKalemleri("ALL")).toHaveLength(3);
  });

  it("hizmet süzgeci tek tipe daralınca lejant da daralır", () => {
    expect(poiLejantKalemleri("SHELTER")).toEqual([
      getPoiMarkerType("SHELTER"),
    ]);
  });
});

describe("poiDetailPath", () => {
  it("PLATFORM kaynaklı ve refId'li noktalar için türe göre doğru rotayı döner", () => {
    expect(poiDetailPath({ type: "VETERINARY", source: "PLATFORM", refId: 5 })).toBe(
      "/hizmetler/veteriner/5",
    );
    expect(poiDetailPath({ type: "PET_SHOP", source: "PLATFORM", refId: 9 })).toBe(
      "/hizmetler/petshop/9",
    );
    expect(poiDetailPath({ type: "SHELTER", source: "PLATFORM", refId: 3 })).toBe(
      "/hizmetler/barinak/3",
    );
  });

  it("OSM/MANUAL kaynaklı (refId'siz) noktalarda null döner", () => {
    expect(poiDetailPath({ type: "VETERINARY", source: "OSM", refId: null })).toBeNull();
    expect(poiDetailPath({ type: "PET_SHOP", source: "MANUAL", refId: null })).toBeNull();
  });

  it("source PLATFORM olsa bile refId yoksa null döner", () => {
    expect(poiDetailPath({ type: "SHELTER", source: "PLATFORM", refId: null })).toBeNull();
  });
});
