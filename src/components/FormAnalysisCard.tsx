import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function FormAnalysisCard() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-form", {
        body: {},
      });

      if (error) {
        setAnalysis("Failed to analyze form. Please try again.");
        return;
      }

      setAnalysis(data?.analysis ?? "No analysis returned.");
    } catch {
      setAnalysis("Failed to analyze form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="uppercase tracking-wider bg-[linear-gradient(90deg,#FF6B6B,#4ECDC4,#45B7D1,#96E6A1,#DDA0DD,#FF6B6B)] bg-[length:300%_auto] animate-[gradient-shift_4s_linear_infinite] bg-clip-text text-transparent text-2xl font-bold shadow-none">
          AI Form Analysis
        </h3>
        <Button
          onClick={handleAnalyze}
          disabled={loading}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            "Analyze Form"
          )}
        </Button>
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
