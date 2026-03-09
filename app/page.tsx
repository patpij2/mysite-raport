"use client";

import { useState } from "react";
import type { ReportData } from "@/types/report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ReportView } from "@/components/report-view";

export default function Home() {
  const [fbPage, setFbPage] = useState("");
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
          country: "PL",
          fbLinks: fbPage.trim(),
          location: undefined,
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
    <div className="min-h-screen bg-muted/30 flex flex-col items-center px-4 py-12">
      <Card className="w-full max-w-md shadow-sm">
        <CardContent className="pt-8 pb-8 px-6 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Raport Social Media dla restauracji
            </h1>
            <span className="inline-block bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded">
              Eurogastro 2026
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fbPage">Strona Facebook restauracji</Label>
            <Input
              id="fbPage"
              placeholder="np. facebook.com/restauracja"
              value={fbPage}
              onChange={(e) => setFbPage(e.target.value)}
              className="h-11"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full h-11 font-medium"
          >
            {loading ? "Generowanie…" : "Generuj raport"}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Automatyczna analiza profilu i reklam - 30 sekund
          </p>
        </CardContent>
      </Card>

      {report && (
        <div className="w-full max-w-2xl mt-10 px-4">
          <ReportView report={report} />
        </div>
      )}
    </div>
  );
}
