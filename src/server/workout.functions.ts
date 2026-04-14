import { createServerFn } from "@tanstack/react-start";
import {
  getSession,
  updateSession,
  pushSensorData,
  resetSession,
  type SensorReading,
} from "@/lib/sensor-store";

// Get current workout session data (polled by frontend)
export const getWorkoutData = createServerFn({ method: "GET" }).handler(async () => {
  return getSession();
});

// Receive sensor data from Raspberry Pi
export const postSensorData = createServerFn({ method: "POST" })
  .inputValidator((input: {
    reps?: number;
    readings?: SensorReading[];
  }) => input)
  .handler(async ({ data }) => {
    if (data.reps !== undefined) {
      updateSession({ reps: data.reps });
    }
    if (data.readings) {
      for (const reading of data.readings) {
        pushSensorData(reading);
      }
    }
    return { success: true };
  });

// Analyze form using AI based on gyroscope data
export const analyzeForm = createServerFn({ method: "POST" }).handler(async () => {
  const session = getSession();
  const recentData = session.sensorData.slice(-50);

  if (recentData.length === 0) {
    return { analysis: "No sensor data available yet. Start your set to get form feedback." };
  }

  // Build a summary of gyroscope data for the AI
  const gyroSummary = recentData.map((r, i) => (
    `t${i}: gX=${r.gyroscopeX.toFixed(3)} gY=${r.gyroscopeY.toFixed(3)} gZ=${r.gyroscopeZ.toFixed(3)} rad/s`
  )).join("\n");

  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) {
    return { analysis: "AI analysis unavailable — API key not configured." };
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert strength & conditioning coach analyzing squat form from IMU gyroscope data (radians/s). The data comes from two sensors placed on either side of a barbell during squats.

Analyze the gyroscope readings (X, Y, Z axes in rad/s) and provide:
1. A brief overall form rating (Good / Needs Improvement / Poor)
2. Specific observations about symmetry between left/right sides
3. Any detected issues (e.g., bar tilt, uneven descent/ascent, excessive rotation)
4. 1-2 actionable corrections

Keep the response concise (under 150 words). Use plain language a lifter would understand.`,
          },
          {
            role: "user",
            content: `Here are the recent gyroscope readings from a squat set (${session.reps} reps completed):\n\n${gyroSummary}`,
          },
        ],
      }),
    });

    if (response.status === 429) {
      return { analysis: "AI rate limit reached. Please try again in a moment." };
    }
    if (response.status === 402) {
      return { analysis: "AI credits exhausted. Please add funds to continue." };
    }
    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return { analysis: "AI analysis temporarily unavailable." };
    }

    const result = await response.json();
    const analysis = result.choices?.[0]?.message?.content || "Unable to generate analysis.";

    updateSession({ formAnalysis: analysis });
    return { analysis };
  } catch (error) {
    console.error("Form analysis error:", error);
    return { analysis: "Failed to analyze form. Please try again." };
  }
});

// Reset the current session
export const resetWorkout = createServerFn({ method: "POST" }).handler(async () => {
  return resetSession();
});
