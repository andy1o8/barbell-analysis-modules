import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getWorkoutData, resetWorkout } from "@/server/workout.functions";
import { RepCounter } from "@/components/RepCounter";
import { SensorDataPanel } from "@/components/SensorDataPanel";
import { FormAnalysisCard } from "@/components/FormAnalysisCard";
import { Button } from "@/components/ui/button";
import type { WorkoutSession } from "@/lib/sensor-store";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Barbell Analysis Module Tracker" },
      { name: "description", content: "Real-time barbell rep counting and AI-powered squat form analysis using Arduino RP2040 IMU sensors." },
    ],
  }),
});

function Dashboard() {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const getDataFn = useServerFn(getWorkoutData);
  const resetFn = useServerFn(resetWorkout);

  // Poll for data every 2 seconds
  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const data = await getDataFn();
        if (active) setSession(data);
      } catch {
        // ignore polling errors
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [getDataFn]);

  const handleReset = async () => {
    const data = await resetFn();
    setSession(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Barbell Analysis Module logo" className="h-10 w-10 rounded-md object-cover" />
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Barbell Analysis Module Tracker</h1>
              <p className="text-xs text-muted-foreground">RP2040 × RPi5 Athletic Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${session ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
              <span className="text-xs text-muted-foreground">
                {session ? "Connected" : "Connecting…"}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset Session
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Rep counter */}
        <RepCounter
          reps={session?.reps ?? 0}
          lastUpdated={session?.lastUpdated ?? new Date().toISOString()}
        />

        {/* Sensor data */}
        <SensorDataPanel readings={session?.sensorData ?? []} />

        {/* AI Form Analysis */}
        <FormAnalysisCard
          currentAnalysis={session?.formAnalysis ?? null}
          hasData={(session?.sensorData.length ?? 0) > 0}
        />
      </main>
    </div>
  );
}
