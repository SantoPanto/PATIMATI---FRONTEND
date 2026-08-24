/*
 * İl/ilçe beyanından yaklaşık koordinat (Nominatim forward search).
 *
 * 22.08 saha şikayetinin kök çözümü: kullanıcı enlem/boylam bilmek zorunda
 * değil — il/ilçe girdiyse ilçe merkezi koordinatı otomatik doldurulur
 * (ilçe-merkezi hatası 25 km'lik eşleştirme yarıçapının içinde kalır).
 *
 * ASLA fırlatmaz — her başarısızlıkta null döner; ilan akışı geokodlama
 * yüzünden kesilmez (BE'deki ReverseGeocodingService ile aynı ilke).
 * Nominatim politikası: kullanıcı-tetikli TEK istek (gönderim anında).
 */
export async function ilIlcedenKoordinat(
  city: string,
  district?: string | null,
): Promise<{ latitude: number; longitude: number } | null> {
  if (!city || !city.trim()) {
    return null;
  }

  const sorgu = [district, city, "Türkiye"]
    .filter((parca) => parca && parca.trim())
    .join(", ");

  const controller = new AbortController();
  const zamanlayici = setTimeout(() => controller.abort(), 2500);

  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=tr&q=" +
      encodeURIComponent(sorgu);

    const cevap = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!cevap.ok) {
      return null;
    }

    const veri: unknown = await cevap.json();
    const ilk = Array.isArray(veri) ? veri[0] : null;
    const latitude = ilk ? Number(ilk.lat) : Number.NaN;
    const longitude = ilk ? Number(ilk.lon) : Number.NaN;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return { latitude, longitude };
  } catch {
    return null;
  } finally {
    clearTimeout(zamanlayici);
  }
}
