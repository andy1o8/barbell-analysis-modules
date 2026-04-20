import { createFileRoute } from "@tanstack/react-router";
import logoImg from "@/assets/logo.jpg";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getWorkoutData, resetWorkout } from "@/server/workout.functions";
import { RepCounter, type LoggedSet } from "@/components/RepCounter";
import { SensorDataPanel } from "@/components/SensorDataPanel";
import { SetTracker } from "@/components/SetTracker";
import { FormAnalysisCard } from "@/components/FormAnalysisCard";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
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
  const [resetting, setResetting] = useState(false);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const getDataFn = useServerFn(getWorkoutData);
  const resetFn = useServerFn(resetWorkout);

  const clearTelemetryAndSession = async () => {
    const { error: delError } = await supabase
      .from("workout_telemetry")
      .delete()
      .gte("id", "00000000-0000-0000-0000-000000000000");
    if (delError) console.error("Delete error:", delError);
    const data = await resetFn();
    setSession(data);
  };

  const handleLogSet = async (reps: number) => {
    // Local-only: do NOT touch the backend. Derived state in RepCounter
    // will naturally show 0 once this set is added to loggedSets.
    setLoggedSets((prev) => [...prev, { setNumber: prev.length + 1, reps, weight: "" }]);
  };

  const handleWeightChange = (setNumber: number, weight: string) => {
    setLoggedSets((prev) =>
      prev.map((s) => (s.setNumber === setNumber ? { ...s, weight } : s)),
    );
  };

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
    setResetting(true);
    try {
      setLoggedSets([]);
      await clearTelemetryAndSession();
    } catch (err) {
      console.error("Reset failed:", err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative border-b bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 py-4 md:flex-row md:justify-between md:gap-0">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Barbell Analysis Module logo" className="h-10 w-10 rounded-md object-cover" />
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight md:text-xl">Barbell Analysis Module Tracker</h1>
              <p className="text-xs text-muted-foreground">Reps and Form Tracker</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ConnectionStatus />
            <Button variant="outline" size="sm" onClick={handleReset} disabled={resetting} className="px-[13px] text-sm">
              {resetting ? "Resetting…" : "Reset Session"}
            </Button>
          </div>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Rep counter */}
        <RepCounter loggedSets={loggedSets} onLogSet={handleLogSet} />

        {/* Set Tracker */}
        <SetTracker loggedSets={loggedSets} onWeightChange={handleWeightChange} />

        {/* AI Form Analysis */}
        <FormAnalysisCard />

        {/* Sensor data */}
        <SensorDataPanel />
      </main>
    </div>
  );
}
