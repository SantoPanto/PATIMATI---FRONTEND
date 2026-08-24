/**
 * İki koordinat arasındaki büyük daire mesafesi (haversine), km cinsinden.
 *
 * Ana sayfadaki mesafe süzgeci ve kartlardaki "x km" bu değeri kullanır.
 * Backend'in aday süzgeciyle aynı kavram (orada PostGIS hesaplıyor); buradaki
 * hesap yalnız GÖSTERİM ve istemci tarafı süzme içindir, eşleştirmeye girmez.
 */
export function mesafeKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const DUNYA_YARICAPI_KM = 6371;

  const rad = (derece: number) => (derece * Math.PI) / 180;

  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * DUNYA_YARICAPI_KM * Math.asin(Math.sqrt(a));
}
