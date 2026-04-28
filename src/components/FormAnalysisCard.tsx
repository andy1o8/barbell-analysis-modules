import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormAnalysisCardProps {
  analysis: string;
  setAnalysis: (value: string) => void;
}

export function FormAnalysisCard({ analysis, setAnalysis }: FormAnalysisCardProps) {
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleAnalyze = async () => {
    setStreaming(true);
    setAnalysis("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-form`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        // Try to parse a JSON error/fallback
        try {
          const json = await resp.json();
          setAnalysis(json.analysis ?? json.error ?? "Failed to analyze form. Please try again.");
        } catch {
          setAnalysis("Failed to analyze form. Please try again.");
        }
        return;
      }

      const contentType = resp.headers.get("content-type") ?? "";

      // Non-streaming fallback (e.g. "no data" early returns)
      if (!contentType.includes("text/event-stream")) {
        const json = await resp.json();
        setAnalysis(json.analysis ?? "No analysis returned.");
        return;
      }

      // SSE streaming
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              accumulated += text;
              setAnalysis(accumulated);
            }
          } catch {
            // partial JSON, ignore
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setAnalysis("Failed to analyze form. Please try again.");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="uppercase tracking-wider text-xl sm:text-2xl font-bold text-foreground whitespace-nowrap">
          AI Form Analysis
        </h3>
        <div className="inline-flex rounded-md p-[3px] [background:conic-gradient(from_var(--angle),#22C55E,#0EA5E9,#6366F1,#A855F7,#22C55E)] animate-[spin-gradient_3s_linear_infinite] shadow-[0_0_12px_2px_rgba(99,102,241,0.4),0_0_24px_4px_rgba(14,165,233,0.2)] self-start sm:self-auto">
          <Button
            onClick={handleAnalyze}
            disabled={streaming}
            size="sm"
            className="bg-card text-foreground hover:bg-card/90 px-[13px] text-sm border-0 rounded-[calc(theme(borderRadius.md)-2px)] py-px disabled:opacity-100 opacity-100"
          >
            {streaming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              "Analyze Form"
            )}
          </Button>
        </div>
      </div>
      <div className="mt-4">
        {analysis ? (
          <div className="rounded-xl bg-muted/50 p-4 text-sm text-foreground space-y-3">
            {analysis.split(/\n\n+/).map((paragraph: string, i: number) => (
              <p key={i} className="leading-relaxed">{paragraph.trim()}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click "Analyze Form" to get AI-powered squat form feedback based on gyroscope data.
          </p>
        )}
      </div>
    </div>
  );
}
