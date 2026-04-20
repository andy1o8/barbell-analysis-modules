import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export interface LoggedSet {
  setNumber: number;
  reps: number;
  weight: string;
}

interface RepCounterProps {
  loggedSets: LoggedSet[];
  onLogSet: (reps: number) => void | Promise<void>;
}

export function RepCounter({ loggedSets = [], onLogSet }: RepCounterProps) {
  const [totalReps, setTotalReps] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    // Fetch initial max total_reps
    supabase
      .from("workout_telemetry")
      .select("total_reps, created_at")
      .order("total_reps", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTotalReps(data[0].total_reps);
          setLastUpdated(data[0].created_at);
        } else {
          setTotalReps(0);
        }
      });

    // Subscribe to realtime inserts and deletes
    const channel = supabase
      .channel("workout-reps")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "workout_telemetry" },
        (payload) => {
          const row = payload.new as { total_reps: number; created_at: string };
          setTotalReps((prev) => Math.max(prev, row.total_reps));
          setLastUpdated(row.created_at);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "workout_telemetry" },
        () => {
          // On reset, refetch the max
          supabase
            .from("workout_telemetry")
            .select("total_reps, created_at")
            .order("total_reps", { ascending: false })
            .limit(1)
            .then(({ data }) => {
              if (data && data.length > 0) {
                setTotalReps(data[0].total_reps);
                setLastUpdated(data[0].created_at);
              } else {
                setTotalReps(0);
                setLastUpdated(new Date().toISOString());
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loggedRepsSum = loggedSets.reduce((sum, s) => sum + s.reps, 0);
  const currentSetReps = Math.max(0, totalReps - loggedRepsSum);

  const timeAgo = getTimeAgo(lastUpdated);

  const handleLogSet = async () => {
    if (currentSetReps <= 0 || logging) return;
    setLogging(true);
    try {
      await onLogSet(currentSetReps);
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-8 shadow-sm">
      <p className="font-bold text-foreground uppercase tracking-wider text-2xl">Reps Completed</p>
      <p className="mt-3 font-bold tabular-nums text-foreground text-8xl">{currentSetReps}</p>
      <p className="mt-2 text-sm text-muted-foreground tabular-nums">
        Total Workout Reps: <span className="font-semibold text-foreground">{totalReps}</span>
      </p>
      <p className="mt-2 text-xs text-muted-foreground">Updated {timeAgo}</p>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleLogSet}
        disabled={logging || currentSetReps <= 0}
        className="mt-5"
      >
        {logging ? "Logging…" : "Log Set"}
      </Button>

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
