import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NodeReading {
  positionZ: number;
  velocityZ: number;
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  gyroscopeX: number;
  gyroscopeY: number;
  gyroscopeZ: number;
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
  { key: "gyroscopeX", label: "Gyro X", unit: "rad/s", decimals: 3 },
  { key: "gyroscopeY", label: "Gyro Y", unit: "rad/s", decimals: 3 },
  { key: "gyroscopeZ", label: "Gyro Z", unit: "rad/s", decimals: 3 },
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

  useEffect(() => {
    // Fetch latest telemetry_update row on mount
    const fetchLatest = async () => {
      const { data } = await supabase
        .from("workout_telemetry")
        .select("sensor_data")
        .eq("event", "telemetry_update")
        .order("created_at", { ascending: false })
        .limit(1);

      const raw = data?.[0]?.sensor_data;
      if (raw && typeof raw === "object") {
        setNodes(raw as unknown as SensorNodes);
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
          const row = payload.new as { event: string; sensor_data: unknown };
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

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <h3 className="text-2xl font-extrabold text-foreground uppercase tracking-wider">
        Live Sensor Data
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
