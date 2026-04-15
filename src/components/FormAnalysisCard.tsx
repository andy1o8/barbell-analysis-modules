import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function FormAnalysisCard() {
  const [analysis, setAnalysis] = useState<string>("");
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
      <div className="flex items-center justify-between">
        <h3 className="uppercase tracking-wider text-2xl font-bold text-foreground">
          AI Form Analysis
        </h3>
        <div className="relative rounded-md p-[3px] [background:conic-gradient(from_var(--angle),#22C55E,#0EA5E9,#6366F1,#A855F7,#22C55E)] animate-[spin-gradient_3s_linear_infinite] [animation:spin-gradient_3s_linear_infinite,glow-pulse_2s_ease-in-out_infinite]">
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
