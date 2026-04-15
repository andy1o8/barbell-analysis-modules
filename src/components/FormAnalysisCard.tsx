import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeForm } from "@/server/workout.functions";
import { Button } from "@/components/ui/button";

interface FormAnalysisCardProps {
  currentAnalysis: string | null;
  hasData: boolean;
}

export function FormAnalysisCard({ currentAnalysis, hasData }: FormAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<string | null>(currentAnalysis);
  const [loading, setLoading] = useState(false);
  const analyzeFormFn = useServerFn(analyzeForm);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeFormFn();
      setAnalysis(result.analysis);
    } catch {
      setAnalysis("Failed to analyze form.");
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
          disabled={loading || !hasData}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? "Analyzing…" : "Analyze Form"}
        </Button>
      </div>
      <div className="mt-4">
        {analysis ? (
          <div className="rounded-xl bg-muted/50 p-4 text-sm leading-relaxed text-foreground whitespace-pre-line">
            {analysis}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {hasData
              ? "Click \"Analyze Form\" to get AI-powered squat form feedback based on gyroscope data."
              : "Complete some reps first to enable form analysis."}
          </p>
        )}
      </div>
    </div>
  );
}
