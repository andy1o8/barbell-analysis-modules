import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const HEARTBEAT_TIMEOUT_MS = 15_000;
const CHECK_INTERVAL_MS = 3_000;

export function ConnectionStatus() {
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Fetch latest row on mount + poll every 3s
  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase
        .from("workout_telemetry")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);
      if (data?.[0]) setLastSeen(data[0].created_at);
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, CHECK_INTERVAL_MS);

    // Also listen for realtime inserts to update immediately
    const channel = supabase
      .channel("heartbeat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "workout_telemetry" },
        (payload) => {
          const row = payload.new as { created_at: string };
          setLastSeen(row.created_at);
        },
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Tick `now` every second so staleness recalculates
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diffMs = lastSeen ? now - new Date(lastSeen).getTime() : Infinity;
  const connected = diffMs <= HEARTBEAT_TIMEOUT_MS;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          connected ? "bg-primary animate-pulse" : "bg-red-600"
        }`}
      />
      <span className="text-xs text-muted-foreground">
        {connected ? "Connected" : `Disconnected · Last seen: ${formatAgo(diffMs)}`}
      </span>
    </div>
  );
}

function formatAgo(ms: number): string {
  if (!isFinite(ms)) return "never";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
