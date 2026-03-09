/**
 * OpenRouter (LLM) – analiza reklam Meta i wykrywanie błędów + rekomendacje.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface AdAnalysis {
  bledy: Array<{ kategoria: string; opis: string }>;
  rekomendacja: string;
}

export async function analyzeAdWithLLM(
  adContent: {
    bodies?: string[];
    linkTitles?: string[];
    linkDescriptions?: string[];
    deliveryStart?: string;
    deliveryStop?: string;
  },
  openRouterApiKey: string
): Promise<AdAnalysis> {
  const bodies = adContent.bodies?.join("\n\n") ?? "";
  const linkTitles = adContent.linkTitles?.join(", ") ?? "";
  const linkDescriptions = adContent.linkDescriptions?.join(", ") ?? "";
  const dates = `Start: ${adContent.deliveryStart ?? "brak"}, Stop: ${adContent.deliveryStop ?? "brak"}`;

  const prompt = `Jesteś ekspertem od reklam Meta (Facebook/Instagram) dla restauracji. Przeanalizuj poniższą reklamę i zwróć JSON w dokładnie tym formacie (bez dodatkowego tekstu, tylko JSON):

{
  "bledy": [
    {"kategoria": "nazwa błędu", "opis": "krótki opis"}
  ],
  "rekomendacja": "1-2 zdania z rekomendacją co poprawić"
}

Typowe błędy: brak CTA (wezwania do działania), brak konkretnej oferty/ceny, przestarzały kreatyw, słaba treść, brak informacji o restauracji, zbyt krótki tekst, brak zachęty do rezerwacji/zadzwonienia.

Treść reklamy:
---
Tekst główny: ${bodies}
Tytuły linków: ${linkTitles}
Opisy linków: ${linkDescriptions}
Daty dostarczania: ${dates}
---

Odpowiedz TYLKO poprawnym JSON-em, bez markdown i bez dodatkowego tekstu. Język: polski.`;

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openRouterApiKey}`,
      "HTTP-Referer": "https://mysite.ai",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API: ${res.status} ${err}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenRouter: brak odpowiedzi");
  }

  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as AdAnalysis;

  if (!parsed.bledy || !Array.isArray(parsed.bledy)) parsed.bledy = [];
  if (typeof parsed.rekomendacja !== "string") parsed.rekomendacja = "";

  return parsed;
}

/**
 * Analiza zbiorcza – jedna analiza LLM dla wielu reklam (aby ograniczyć koszt).
 */
export async function analyzeAdsBatch(
  ads: Array<{
    page_name?: string;
    ad_creative_bodies?: string[];
    ad_creative_link_titles?: string[];
    ad_creative_link_descriptions?: string[];
    ad_delivery_start_time?: string;
    ad_delivery_stop_time?: string;
  }>,
  openRouterApiKey: string
): Promise<Map<string, AdAnalysis>> {
  const results = new Map<string, AdAnalysis>();

  for (let i = 0; i < ads.length; i++) {
    const ad = ads[i];
    const key = `${ad.page_name ?? "unknown"}-${i}`;

    try {
      const analysis = await analyzeAdWithLLM(
        {
          bodies: ad.ad_creative_bodies,
          linkTitles: ad.ad_creative_link_titles,
          linkDescriptions: ad.ad_creative_link_descriptions,
          deliveryStart: ad.ad_delivery_start_time,
          deliveryStop: ad.ad_delivery_stop_time,
        },
        openRouterApiKey
      );
      results.set(key, analysis);
    } catch (e) {
      results.set(key, {
        bledy: [{ kategoria: "Błąd analizy", opis: String(e) }],
        rekomendacja: "Nie udało się przeprowadzić analizy.",
      });
    }

    // Krótka pauza między wywołaniami
    if (i < ads.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}
