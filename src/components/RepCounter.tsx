import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export interface LoggedSet {
  setNumber: number;
  reps: number;
}

interface RepCounterProps {
  resetSignal?: number;
  loggedSets: LoggedSet[];
  onLogSet: (reps: number) => void | Promise<void>;
}

export function RepCounter({ resetSignal, loggedSets = [], onLogSet }: RepCounterProps) {
  const [reps, setReps] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [logging, setLogging] = useState(false);

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

  const handleLogSet = async () => {
    if (reps <= 0 || logging) return;
    setLogging(true);
    try {
      await onLogSet(reps);
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-8 shadow-sm">
      <p className="font-bold text-foreground uppercase tracking-wider text-2xl">Reps Completed</p>
      <p className="mt-3 font-bold tabular-nums text-foreground text-8xl">{reps}</p>
      <p className="mt-3 text-xs text-muted-foreground">Updated {timeAgo}</p>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleLogSet}
        disabled={logging || reps <= 0}
        className="mt-5"
      >
        {logging ? "Logging…" : "Log Set"}
      </Button>

      <div className="mt-6 w-full">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Set Tracker
        </p>
        {loggedSets.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground/70">
            No sets logged yet — finish a set and tap “Log Set”.
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            {loggedSets.map((s) => (
              <div
                key={s.setNumber}
                className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground"
              >
                <span className="text-muted-foreground">Set {s.setNumber}:</span>
                <span className="tabular-nums">{s.reps} reps</span>
              </div>
            ))}
          </div>
        )}
      </div>
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
