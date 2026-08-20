const NOMINATIM_REVERSE_URL =
  "https://nominatim.openstreetmap.org/reverse";

type ReverseGeocodingResponse = {
  address?: unknown;
};

export function isValidCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): latitude is number {
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function getAddressValue(
  address: unknown,
  keys: readonly string[],
): string | null {
  if (!address || typeof address !== "object") {
    return null;
  }

  const addressRecord = address as Record<string, unknown>;

  for (const key of keys) {
    const value = addressRecord[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

export async function reverseGeocodeCity(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<string | null> {
  if (!isValidCoordinates(latitude, longitude)) {
    throw new Error("Geçersiz konum koordinatları.");
  }

  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    "accept-language": "tr",
  });

  const response = await fetch(
    `${NOMINATIM_REVERSE_URL}?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Konum bilgisi alınamadı (${response.status}).`,
    );
  }

  const data = (await response.json()) as ReverseGeocodingResponse | null;

  return getAddressValue(data?.address, [
    "province",
    "city",
    "town",
    "municipality",
    "county",
    "state",
  ]);
}
