import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

const HEARTBEAT_TIMEOUT_MS = 15_000;

interface NodeReading {
  positionZ: number;
  velocityZ: number;
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
}

interface SensorNodes {
  left?: NodeReading;
  right?: NodeReading;
}

const METRICS: { key: keyof NodeReading; label: string; unit: string; decimals: number }[] = [
  { key: "positionZ", label: "Pos Z", unit: "m", decimals: 3 },
  { key: "velocityZ", label: "Vel Z", unit: "m/s", decimals: 3 },
  { key: "accelerationX", label: "Acc X", unit: "m/s²", decimals: 2 },
  { key: "accelerationY", label: "Acc Y", unit: "m/s²", decimals: 2 },
  { key: "accelerationZ", label: "Acc Z", unit: "m/s²", decimals: 2 },
  { key: "gyroX", label: "Gyro X", unit: "°/s", decimals: 3 },
  { key: "gyroY", label: "Gyro Y", unit: "°/s", decimals: 3 },
  { key: "gyroZ", label: "Gyro Z", unit: "°/s", decimals: 3 },
];

function NodeGrid({ node, side }: { node: NodeReading; side: string }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {side}
      </h4>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {METRICS.map((m) => (
          <div key={m.key} className="rounded-xl bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
              {(Number(node[m.key] ?? 0)).toFixed(m.decimals)}
              <span className="ml-1 text-[10px] font-normal text-muted-foreground">{m.unit}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SensorDataPanel() {
  const [nodes, setNodes] = useState<SensorNodes | null>(null);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Tick `now` every second for staleness check
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch latest telemetry_update row on mount
    const fetchLatest = async () => {
      const { data } = await supabase
        .from("workout_telemetry")
        .select("sensor_data, created_at")
        .eq("event", "telemetry_update")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data?.[0]) {
        setLastSeen(data[0].created_at);
        const raw = data[0].sensor_data;
        if (raw && typeof raw === "object") {
          setNodes(raw as unknown as SensorNodes);
        }
      }
    };
    fetchLatest();

    // Subscribe to realtime inserts
    const channel = supabase
      .channel("sensor-telemetry")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "workout_telemetry" },
        (payload) => {
          const row = payload.new as { event: string; sensor_data: unknown; created_at: string };
          setLastSeen(row.created_at);
          if (row.event === "telemetry_update" && row.sensor_data) {
            setNodes(row.sensor_data as SensorNodes);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const connected = useMemo(() => {
    if (!lastSeen) return false;
    return now - new Date(lastSeen).getTime() <= HEARTBEAT_TIMEOUT_MS;
  }, [lastSeen, now]);

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <h3 className="flex items-center gap-2.5 text-2xl text-foreground uppercase tracking-wider font-bold">
        Live Sensor Data
        <span className={`inline-block h-3 w-3 rounded-full ${connected ? "bg-red-600 animate-pulse" : "bg-muted-foreground/40"}`} />
      </h3>

      {!nodes ? (
        <p className="mt-4 text-sm text-muted-foreground">Waiting for sensor data from RPi…</p>
      ) : (
        <div className="mt-4 space-y-5">
          {nodes.left && <NodeGrid node={nodes.left} side="Left Node" />}
          {nodes.right && <NodeGrid node={nodes.right} side="Right Node" />}
          {!nodes.left && !nodes.right && (
            <p className="text-sm text-muted-foreground">
              Telemetry received but no left/right node data found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
