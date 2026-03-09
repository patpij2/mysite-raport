export type ParsedFbLink = { type: "id"; value: string } | { type: "username"; value: string };

/**
 * Wyciąga z linku Facebook albo numeryczne Page ID, albo username strony.
 */
export function parseFbUrl(url: string): ParsedFbLink | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const validHosts = [
      "facebook.com",
      "www.facebook.com",
      "m.facebook.com",
      "fb.com",
      "www.fb.com",
    ];
    if (!validHosts.some((h) => host === h || host.endsWith(`.${h}`))) {
      return null;
    }

    const pathname = parsed.pathname.replace(/\/$/, "") || "/";
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];

    if (!firstSegment) return null;

    if (/^\d+$/.test(firstSegment)) {
      return { type: "id", value: firstSegment };
    }
    return { type: "username", value: firstSegment };
  } catch {
    return null;
  }
}

export function extractPageIdFromUrl(url: string): string | null {
  const p = parseFbUrl(url);
  return p?.type === "id" ? p.value : null;
}

/**
 * Parsuje wiele linków i zwraca listę: numeryczne ID + usernames (do rozwikłania przez Graph API).
 */
export function parseFbLinks(text: string): ParsedFbLink[] {
  const lines = text.split(/[\n,;]+/).map((l) => l.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: ParsedFbLink[] = [];
  for (const line of lines) {
    const p = parseFbUrl(line);
    if (p && !seen.has(p.value)) {
      seen.add(p.value);
      out.push(p);
    }
  }
  return out;
}

/** Jak wcześniej – tylko numeryczne ID (bez rozwiązywania username). */
export function extractPageIdsFromUrls(text: string): string[] {
  return parseFbLinks(text)
    .filter((p): p is { type: "id"; value: string } => p.type === "id")
    .map((p) => p.value);
}
