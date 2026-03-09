/**
 * Meta Ad Library API – pobieranie reklam dla podanych Page ID.
 * Dane dostępne tylko dla reklam dostarczanych w UK lub UE (ostatni rok).
 */

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const ADS_ARCHIVE_ENDPOINT = `${GRAPH_BASE}/ads_archive`;

/**
 * Rozwiązuje username strony (np. Fedde.Restauracja.Polska) na numeryczne Page ID.
 * Wymaga META_ACCESS_TOKEN (User Access Token z Graph API Explorer).
 */
export async function resolveUsernameToPageId(
  username: string,
  accessToken: string
): Promise<string | null> {
  const url = `${GRAPH_BASE}/${encodeURIComponent(username)}?fields=id&access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url);
  const json = (await res.json()) as { id?: string } & { error?: { message: string; code?: number } };
  if (json.error) {
    throw new Error(`Graph API (${username}): ${json.error.message}`);
  }
  return json.id ?? null;
}

export interface MetaAd {
  id: string;
  page_id: string;
  page_name: string;
  ad_creation_time?: string;
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_descriptions?: string[];
  ad_creative_link_captions?: string[];
  ad_snapshot_url?: string;
  publisher_platforms?: string[];
}

export interface MetaAdsArchiveResponse {
  data?: MetaAd[];
  paging?: {
    cursors?: { before?: string; after?: string };
    next?: string;
  };
  error?: { message: string; code?: number };
}

const FIELDS =
  "id,page_id,page_name,ad_creation_time,ad_delivery_start_time,ad_delivery_stop_time,ad_creative_bodies,ad_creative_link_titles,ad_creative_link_descriptions,ad_creative_link_captions,ad_snapshot_url,publisher_platforms";

export async function fetchAdsByPageIds(
  pageIds: string[],
  country: string,
  accessToken: string
): Promise<MetaAd[]> {
  if (pageIds.length === 0) return [];

  const allAds: MetaAd[] = [];
  const url = new URL(ADS_ARCHIVE_ENDPOINT);
  url.searchParams.set("search_page_ids", JSON.stringify(pageIds));
  url.searchParams.set("ad_reached_countries", JSON.stringify([country]));
  url.searchParams.set("ad_active_status", "ALL");
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("limit", "100");

  let nextUrl: string | null = url.toString();

  while (nextUrl) {
    const res = await fetch(nextUrl);
    const json = (await res.json()) as MetaAdsArchiveResponse;

    if (json.error) {
      throw new Error(`Meta Ad Library API: ${json.error.message}`);
    }

    if (json.data && json.data.length > 0) {
      allAds.push(...json.data);
    }

    nextUrl = json.paging?.next ?? null;
  }

  return allAds;
}
