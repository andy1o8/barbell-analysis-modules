import type { SensorReading } from "@/lib/sensor-store";

interface SensorDataPanelProps {
  readings: SensorReading[];
}

export function SensorDataPanel({ readings }: SensorDataPanelProps) {
  const latest = readings.length > 0 ? readings[readings.length - 1] : null;

  if (!latest) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Live Sensor Data</h3>
        <p className="mt-4 text-sm text-muted-foreground">Waiting for sensor data from RPi…</p>
      </div>
    );
  }

  const metrics = [
    { label: "Position Z", value: latest.positionZ.toFixed(3), unit: "m" },
    { label: "Velocity Z", value: latest.velocityZ.toFixed(3), unit: "m/s" },
    { label: "Accel X", value: latest.accelerationX.toFixed(2), unit: "m/s²" },
    { label: "Accel Y", value: latest.accelerationY.toFixed(2), unit: "m/s²" },
    { label: "Accel Z", value: latest.accelerationZ.toFixed(2), unit: "m/s²" },
    { label: "Gyro X", value: latest.gyroscopeX.toFixed(3), unit: "rad/s" },
    { label: "Gyro Y", value: latest.gyroscopeY.toFixed(3), unit: "rad/s" },
    { label: "Gyro Z", value: latest.gyroscopeZ.toFixed(3), unit: "rad/s" },
  ];

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Live Sensor Data</h3>
        <span className="text-xs text-muted-foreground">Node: {latest.nodeId}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl bg-muted/50 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
              {m.value}
              <span className="ml-1 text-xs font-normal text-muted-foreground">{m.unit}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
