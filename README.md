# Raport konkurencji Meta Ads | mysite.ai

Internal tool do generowania raportów o reklamach Meta w okolicy restauracji. Prosty UI: wpisujesz linki FB i opcjonalnie lokalizację, dostajesz raport z analizą błędów w reklamach, możesz pobrać raport jako HTML.

## Stack

- Next.js (App Router), React, Tailwind CSS
- shadcn/ui
- Meta Ad Library API
- Google Places API (Text Search)
- OpenRouter (LLM – analiza reklam)

## Uruchomienie

```bash
npm install
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000).

## Zmienne środowiskowe

Skopiuj `env.example` do `.env.local` i uzupełnij:

| Zmienna | Opis |
|--------|------|
| `GOOGLE_PLACES_API_KEY` | Klucz API z Google Cloud (Places API) |
| `META_APP_ID` | ID aplikacji Meta for Developers |
| `META_ACCESS_TOKEN` | Token do Meta Ad Library API |
| `OPENROUTER_API_KEY` | Klucz z openrouter.ai |

## Użycie

1. Wybierz **kraj** (np. PL, DE, GB).
2. Wklej **linki do stron Facebook** (np. `https://fb.com/123456789`). Jeden link per linia. Używaj linków z numerycznym ID.
3. Opcjonalnie: **lokalizacja** – adres lub zapytanie (np. „restauracje Warszawa”) do Google Places.
4. Kliknij **Generuj raport**.
5. Pobierz raport przyciskiem **Pobierz HTML**.

## Ograniczenia

- Meta Ad Library API zwraca reklamy tylko dla UK/UE (ostatni rok).
- Linki FB muszą zawierać numeryczny Page ID (np. `fb.com/123456789`). Dla linków z username (np. `facebook.com/NazwaStrony`) użyj linku z Ad Library.

## Deploy na Vercel

- Ten projekt **nie używa Puppeteer ani Chrome**. Jeśli na Vercel widzisz błąd „Could not find Chrome” / „Analysis error”:
  1. Upewnij się, że projekt na Vercel jest podłączony **do tego samego repo** (np. `mysite-raport`) i brancha (np. `main`).
  2. W Vercel → Settings → General: **Clear Build Cache** i zrób **Redeploy**.
  3. Sprawdź, czy w repo (na branchu z którego deployujesz) **nie ma** `puppeteer`, `puppeteer-core` ani żadnego kodu wywołującego Chrome.
- Zmienne env: w Vercel → Settings → Environment Variables ustaw `META_ACCESS_TOKEN`, `OPENROUTER_API_KEY`, `GOOGLE_PLACES_API_KEY`.
- Diagnostyka: po deployu wejdź na `https://twoja-domena.vercel.app/api/health` – zobaczysz, czy zmienne są ustawione.
