import { NextResponse } from "next/server";
import { parseFbLinks } from "@/lib/parse-fb-url";
import { fetchAdsByPageIds, resolveUsernameToPageId, type MetaAd } from "@/lib/meta-ads";
import { searchPlaces, type Place } from "@/lib/places";
import { analyzeAdsBatch } from "@/lib/analyze-ads";

export interface GenerateReportRequest {
  country: string;
  fbLinks: string;
  location?: string;
}

export interface ReportResponse {
  places: Place[];
  ads: MetaAd[];
  analyses: Array<{
    adKey: string;
    pageName: string;
    bledy: Array<{ kategoria: string; opis: string }>;
    rekomendacja: string;
  }>;
  errors?: string[];
}

export async function POST(request: Request) {
  const errors: string[] = [];

  try {
    const body = (await request.json()) as GenerateReportRequest;
    const { country, fbLinks, location } = body;

    if (!country || !fbLinks?.trim()) {
      return NextResponse.json(
        { error: "Kraj i linki FB są wymagane." },
        { status: 400 }
      );
    }

    const parsed = parseFbLinks(fbLinks);
    const metaToken = process.env.META_ACCESS_TOKEN;
    const hasUsernames = parsed.some((p) => p.type === "username");

    // Zbierz numeryczne ID i rozwiąż usernames przez Graph API
    const pageIds = new Set<string>();
    for (const p of parsed) {
      if (p.type === "id") {
        pageIds.add(p.value);
      } else if (p.type === "username") {
        if (!metaToken) {
          errors.push(
            "Link z nazwą strony wymaga META_ACCESS_TOKEN. Dodaj go do .env.local (token z Meta for Developers → Graph API Explorer, wygeneruj User Access Token z uprawnieniem ads_read)."
          );
          break;
        }
        try {
          const id = await resolveUsernameToPageId(p.value, metaToken);
          if (id) pageIds.add(id);
          else errors.push(`Nie znaleziono strony: ${p.value}`);
        } catch (e) {
          errors.push(String(e));
        }
      }
    }
    const pageIdsArray = Array.from(pageIds);

    let places: Place[] = [];
    let ads: MetaAd[] = [];
    const analyses: ReportResponse["analyses"] = [];

    // Meta Ad Library
    if (metaToken && pageIdsArray.length > 0) {
      try {
        ads = await fetchAdsByPageIds(pageIdsArray, country, metaToken);
      } catch (e) {
        errors.push(`Meta Ad Library: ${String(e)}`);
      }
    } else if (pageIdsArray.length === 0 && !hasUsernames) {
      errors.push(
        "Nie rozpoznano linku. Wklej pełny adres, np. https://www.facebook.com/Fedde.Restauracja.Polska/ lub https://fb.com/123456789"
      );
    } else if (pageIdsArray.length === 0 && hasUsernames) {
      errors.push(
        "Nie udało się uzyskać Page ID z podanych linków. Sprawdź, czy w .env.local jest META_ACCESS_TOKEN (User Access Token z Graph API Explorer, z uprawnieniem ads_read)."
      );
    }

    // Google Places (opcjonalnie)
    const placesKey = process.env.GOOGLE_PLACES_API_KEY;
    if (placesKey && location?.trim()) {
      try {
        const query = location.includes("restaurant") || location.includes("restauracj")
          ? location
          : `restauracje ${location}`;
        places = await searchPlaces(query, placesKey);
      } catch (e) {
        const msg = String(e);
        errors.push(
          msg.includes("has not been used") || msg.includes("is disabled")
            ? `Google Places: włącz „Places API (New)” w projekcie: https://console.cloud.google.com/apis/library/places.googleapis.com`
            : `Google Places: ${msg}`
        );
      }
    }

    // OpenRouter – analiza reklam
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey && ads.length > 0) {
      try {
        const analysisMap = await analyzeAdsBatch(
          ads.map((a) => ({
            page_name: a.page_name,
            ad_creative_bodies: a.ad_creative_bodies,
            ad_creative_link_titles: a.ad_creative_link_titles,
            ad_creative_link_descriptions: a.ad_creative_link_descriptions,
            ad_delivery_start_time: a.ad_delivery_start_time,
            ad_delivery_stop_time: a.ad_delivery_stop_time,
          })),
          openRouterKey
        );

        let i = 0;
        for (const ad of ads) {
          const key = `${ad.page_name ?? "unknown"}-${i}`;
          const a = analysisMap.get(key);
          if (a) {
            analyses.push({
              adKey: ad.id,
              pageName: ad.page_name ?? "",
              bledy: a.bledy,
              rekomendacja: a.rekomendacja,
            });
          }
          i++;
        }
      } catch (e) {
        errors.push(`OpenRouter: ${String(e)}`);
      }
    }

    const response: ReportResponse = {
      places,
      ads,
      analyses,
      errors: errors.length > 0 ? errors : undefined,
    };

    return NextResponse.json(response);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const details = e instanceof Error ? e.stack : undefined;
    console.error("[generate-report] unexpected error:", message, details);
    return NextResponse.json(
      {
        error: message,
        details: process.env.NODE_ENV === "development" ? details : undefined,
        places: [],
        ads: [],
        analyses: [],
        errors: [message],
      },
      { status: 500 }
    );
  }
}
