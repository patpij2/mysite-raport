"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ReportData } from "@/types/report";

interface ReportViewProps {
  report: ReportData;
}

function toHtml(report: ReportData): string {
  const date = new Date().toISOString().slice(0, 10);
  const title = `Raport konkurencji Meta Ads – ${date}`;
  const css = `
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    h2 { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
    .section { margin-bottom: 2rem; }
    .place, .ad, .analysis { padding: 0.75rem; margin: 0.5rem 0; border: 1px solid #e5e7eb; border-radius: 0.5rem; }
    .blad { margin: 0.25rem 0; color: #b91c1c; }
    .rekomendacja { margin-top: 0.5rem; font-style: italic; color: #374151; }
    .cta { margin-top: 2rem; padding: 1rem; background: #f3f4f6; border-radius: 0.5rem; text-align: center; }
    a { color: #1d4ed8; }
  `;

  let body = `
    <h1>${title}</h1>
    <p>powered by <a href="https://mysite.ai">mysite.ai</a></p>
  `;

  if (report.errors && report.errors.length > 0) {
    body += `<div class="section"><h2>Uwagi</h2><ul>`;
    report.errors.forEach((e) => {
      body += `<li>${escapeHtml(e)}</li>`;
    });
    body += `</ul></div>`;
  }

  if (report.places.length > 0) {
    body += `<div class="section"><h2>Restauracje w okolicy</h2>`;
    report.places.forEach((p) => {
      body += `<div class="place"><strong>${escapeHtml(p.displayName ?? p.id)}</strong><br>${escapeHtml(p.formattedAddress ?? "")}</div>`;
    });
    body += `</div>`;
  }

  if (report.ads.length > 0) {
    body += `<div class="section"><h2>Reklamy Meta</h2>`;
    report.ads.forEach((ad) => {
      const bodyText = ad.ad_creative_bodies?.join(" ") ?? "";
      body += `
        <div class="ad">
          <strong>${escapeHtml(ad.page_name)}</strong><br>
          <small>${escapeHtml(ad.ad_delivery_start_time ?? "")} – ${escapeHtml(ad.ad_delivery_stop_time ?? "")}</small>
          <p>${escapeHtml(bodyText.slice(0, 500))}${bodyText.length > 500 ? "…" : ""}</p>
        </div>
      `;
    });
    body += `</div>`;
  }

  if (report.analyses.length > 0) {
    body += `<div class="section"><h2>Analiza błędów i rekomendacje</h2>`;
    report.analyses.forEach((a) => {
      body += `<div class="analysis">`;
      body += `<strong>${escapeHtml(a.pageName)}</strong>`;
      body += `<ul>`;
      a.bledy.forEach((b) => {
        body += `<li class="blad">${escapeHtml(b.kategoria)}: ${escapeHtml(b.opis)}</li>`;
      });
      body += `</ul>`;
      if (a.rekomendacja) {
        body += `<p class="rekomendacja">${escapeHtml(a.rekomendacja)}</p>`;
      }
      body += `</div>`;
    });
    body += `</div>`;
  }

  body += `
    <div class="cta">
      <p><strong>Popraw swoją reklamę z mysite.ai</strong></p>
      <p><a href="https://mysite.ai/en/contact/">Contact us</a></p>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${css}</style>
</head>
<body>
${body}
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadHtml(report: ReportData) {
  const html = toHtml(report);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `raport-konkurencji-${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportView({ report }: ReportViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Raport</h2>
        <Button onClick={() => downloadHtml(report)} variant="outline">
          Pobierz HTML
        </Button>
      </div>

      {report.errors && report.errors.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Uwagi</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {report.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {report.places.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Restauracje w okolicy</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.places.map((p) => (
                <li key={p.id} className="rounded border p-3 text-sm">
                  <strong>{p.displayName ?? p.id}</strong>
                  {p.formattedAddress && (
                    <p className="text-muted-foreground">{p.formattedAddress}</p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {report.ads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reklamy Meta</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {report.ads.map((ad) => {
                const bodyText = ad.ad_creative_bodies?.join(" ") ?? "";
                return (
                  <li key={ad.id} className="rounded border p-3 text-sm">
                    <strong>{ad.page_name}</strong>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ad.ad_delivery_start_time} – {ad.ad_delivery_stop_time ?? "aktywna"}
                    </p>
                    <p className="mt-1 line-clamp-3">{bodyText.slice(0, 300)}…</p>
                    {ad.ad_snapshot_url && (
                      <a
                        href={ad.ad_snapshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-primary hover:underline"
                      >
                        Zobacz reklamę →
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {report.analyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analiza błędów i rekomendacje</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {report.analyses.map((a, i) => (
                <li key={i} className="rounded border p-3">
                  <strong>{a.pageName}</strong>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-destructive/90">
                    {a.bledy.map((b, j) => (
                      <li key={j}>
                        {b.kategoria}: {b.opis}
                      </li>
                    ))}
                  </ul>
                  {a.rekomendacja && (
                    <p className="mt-2 text-sm italic text-muted-foreground">
                      {a.rekomendacja}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <p className="font-medium">Popraw swoją reklamę z mysite.ai</p>
          <p className="text-sm text-muted-foreground">
            Zobacz, jak mysite.ai pomaga restauracjom
          </p>
          <Button asChild>
            <Link
              href="https://mysite.ai/en/contact/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact us
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
