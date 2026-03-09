"use client";

import { useState } from "react";
import type { ReportData } from "@/types/report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportView } from "@/components/report-view";

const COUNTRIES = [
  { value: "PL", label: "Polska (PL)" },
  { value: "DE", label: "Niemcy (DE)" },
  { value: "GB", label: "Wielka Brytania (GB)" },
  { value: "FR", label: "Francja (FR)" },
  { value: "IT", label: "Włochy (IT)" },
  { value: "ES", label: "Hiszpania (ES)" },
  { value: "NL", label: "Holandia (NL)" },
  { value: "BE", label: "Belgia (BE)" },
  { value: "AT", label: "Austria (AT)" },
  { value: "PT", label: "Portugalia (PT)" },
];

export default function Home() {
  const [country, setCountry] = useState("PL");
  const [fbLinks, setFbLinks] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setReport(null);
    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          fbLinks,
          location: location.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error ?? data?.errors?.[0] ?? "Błąd generowania raportu";
        const detail = data?.details ? `\n${data.details}` : "";
        throw new Error(msg + detail);
      }
      setReport(data);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setReport({
        places: [],
        ads: [],
        analyses: [],
        errors: [errMsg],
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">
        Raport konkurencji Meta Ads
      </h1>
      <p className="mb-6 text-muted-foreground">
        Wprowadź linki do stron Facebook i opcjonalnie lokalizację. Raport pokaże
        reklamy Meta oraz analizę błędów.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Parametry raportu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">Kraj</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger id="country">
                <SelectValue placeholder="Wybierz kraj" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Meta Ad Library zwraca reklamy dostarczane w wybranym kraju (UE/UK).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fbLinks">Linki do stron Facebook</Label>
            <Textarea
              id="fbLinks"
              placeholder="https://fb.com/123456789&#10;https://facebook.com/987654321"
              value={fbLinks}
              onChange={(e) => setFbLinks(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Jeden link per linia. Działają linki z nazwą (np. facebook.com/Fedde.Restauracja.Polska)
              oraz z numerem ID (fb.com/123456789). Wymaga META_ACCESS_TOKEN w .env.local.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Lokalizacja (opcjonalnie)</Label>
            <Input
              id="location"
              placeholder="np. restauracje Warszawa, Marszałkowska"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Adres lub zapytanie dla Google Places – lista restauracji w okolicy jako kontekst.
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Generowanie…" : "Generuj raport"}
          </Button>
        </CardContent>
      </Card>

      {report && (
        <div className="mt-8">
          <ReportView report={report} />
        </div>
      )}
    </div>
  );
}
