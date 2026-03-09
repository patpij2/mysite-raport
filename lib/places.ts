/**
 * Google Places API – Nearby Search / Text Search dla restauracji w okolicy.
 */

const PLACES_API_BASE = "https://places.googleapis.com/v1/places";

export interface Place {
  id: string;
  displayName?: string;
  formattedAddress?: string;
  types?: string[];
}

export interface PlacesNearbyResponse {
  places?: Array<{
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    types?: string[];
  }>;
  error?: { message: string };
}

/**
 * Text Search – wyszukuje miejsca po zapytaniu tekstowym (np. "restauracje Warszawa").
 * Używa Places API (New) – Text Search.
 */
export async function searchPlaces(
  query: string,
  apiKey: string
): Promise<Place[]> {
  if (!query.trim()) return [];

  const url = `${PLACES_API_BASE}:searchText`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.name,places.displayName,places.formattedAddress,places.types",
    },
    body: JSON.stringify({
      textQuery: query,
      pageSize: 20,
    }),
  });

  const json = (await res.json()) as { places?: Array<{
    id?: string;
    name?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    types?: string[];
  }> } & { error?: { message: string } };

  if (json.error) {
    throw new Error(`Google Places API: ${json.error.message}`);
  }

  const places = json.places ?? [];
  return places.map((p, i) => ({
    id: p.id ?? p.name ?? `place-${i}`,
    displayName: p.displayName?.text,
    formattedAddress: p.formattedAddress,
    types: p.types,
  }));
}
