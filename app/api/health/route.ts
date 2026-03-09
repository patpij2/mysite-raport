import { NextResponse } from "next/server";

/**
 * GET /api/health – sprawdza, czy zmienne środowiskowe są ustawione (bez pokazywania wartości).
 * Na Vercel: upewnij się, że w Settings → Environment Variables są: META_ACCESS_TOKEN, OPENROUTER_API_KEY, GOOGLE_PLACES_API_KEY.
 */
export async function GET() {
  const env = {
    META_ACCESS_TOKEN: !!process.env.META_ACCESS_TOKEN,
    OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
    GOOGLE_PLACES_API_KEY: !!process.env.GOOGLE_PLACES_API_KEY,
  };
  return NextResponse.json({
    ok: true,
    env,
    app: "mysite-raport",
    note: "Wszystkie trzy powinny być true na Vercel. Brak tokena = brak tej części raportu. Ten projekt NIE używa Puppeteer ani Chrome.",
  });
}
