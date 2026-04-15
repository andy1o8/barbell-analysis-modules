import { createFileRoute } from "@tanstack/react-router";
import logoImg from "@/assets/logo.jpg";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getWorkoutData, resetWorkout } from "@/server/workout.functions";
import { RepCounter } from "@/components/RepCounter";
import { SensorDataPanel } from "@/components/SensorDataPanel";
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
  const [resetSignal, setResetSignal] = useState(0);
  const [resetting, setResetting] = useState(false);
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
    setResetting(true);
    try {
      // 1. Delete all rows from workout_telemetry
      const { error: delError } = await supabase
        .from("workout_telemetry")
        .delete()
        .gte("id", "00000000-0000-0000-0000-000000000000");
      if (delError) console.error("Delete error:", delError);

      // 2. Reset local rep counter state immediately
      setResetSignal((s) => s + 1);

      // 3. Reset server-side session
      const data = await resetFn();
      setSession(data);
    } catch (err) {
      console.error("Reset failed:", err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 py-4 md:flex-row md:justify-between md:gap-0">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Barbell Analysis Module logo" className="h-10 w-10 rounded-md object-cover" />
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Barbell Analysis Module Tracker</h1>
              <p className="text-xs text-muted-foreground">Reps and Form Tracker</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ConnectionStatus />
            <Button variant="outline" size="sm" onClick={handleReset} disabled={resetting} className="px-[13px] text-sm">
              {resetting ? "Resetting…" : "Reset Session"}
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Rep counter */}
        <RepCounter resetSignal={resetSignal} />

        {/* Sensor data */}
        <SensorDataPanel />

        {/* AI Form Analysis */}
        <FormAnalysisCard />
      </main>
    </div>
  );
}
