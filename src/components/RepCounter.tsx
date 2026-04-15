import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function RepCounter({ resetSignal }: { resetSignal?: number }) {
  const [reps, setReps] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  // Reset local state when resetSignal changes
  useEffect(() => {
    if (resetSignal && resetSignal > 0) {
      setReps(0);
      setLastUpdated(new Date().toISOString());
    }
  }, [resetSignal]);

  useEffect(() => {
    // Fetch initial max total_reps
    supabase
      .from("workout_telemetry")
      .select("total_reps, created_at")
      .order("total_reps", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setReps(data[0].total_reps);
          setLastUpdated(data[0].created_at);
        }
      });

    // Subscribe to realtime inserts
    const channel = supabase
      .channel("workout-reps")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "workout_telemetry" },
        (payload) => {
          const row = payload.new as { total_reps: number; created_at: string };
          setReps((prev) => Math.max(prev, row.total_reps));
          setLastUpdated(row.created_at);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const timeAgo = getTimeAgo(lastUpdated);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-8 shadow-sm">
      <p className="font-bold text-foreground uppercase tracking-wider text-2xl">Reps Completed</p>
      <p
        className="mt-3 text-7xl font-bold tabular-nums bg-clip-text text-transparent animate-[spin-gradient_3s_linear_infinite]"
        style={{
          backgroundImage: "conic-gradient(from var(--angle), #22C55E, #0EA5E9, #6366F1, #A855F7, #22C55E)",
          filter: "drop-shadow(0 0 12px rgba(99,102,241,0.5)) drop-shadow(0 0 24px rgba(14,165,233,0.3))",
        }}
      >
        {reps}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">Updated {timeAgo}</p>
    </div>
  );
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 5000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}
