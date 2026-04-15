import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch all telemetry rows ordered by time
    const { data: rows, error } = await supabase
      .from("workout_telemetry")
      .select("sensor_data, total_reps, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ analysis: "No sensor data available yet. Complete some reps first." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Downsample: take every Nth row, capped at 50 data points
    const MAX_POINTS = 50;
    const step = Math.max(1, Math.ceil(rows.length / MAX_POINTS));
    const sampled = rows.filter((_, i) => i % step === 0).slice(0, MAX_POINTS);

    // Extract gyro data as compact JSON array
    const gyroData: any[] = [];
    let latestReps = 0;

    for (const row of sampled) {
      const sd = row.sensor_data as Record<string, any> | null;
      if (row.total_reps > latestReps) latestReps = row.total_reps;
      if (!sd) continue;
      const l = sd.left;
      const r = sd.right;
      if (!l && !r) continue;
      gyroData.push({
        l: [+(l?.gyroX?.toFixed(1) ?? 0), +(l?.gyroY?.toFixed(1) ?? 0), +(l?.gyroZ?.toFixed(1) ?? 0)],
        r: [+(r?.gyroX?.toFixed(1) ?? 0), +(r?.gyroY?.toFixed(1) ?? 0), +(r?.gyroZ?.toFixed(1) ?? 0)],
      });
    }

    // Call Gemini API
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ analysis: "AI analysis unavailable — Gemini API key not configured." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const systemPrompt = `You are an expert powerlifting coach and biomechanics analyst. I am providing you with time-series gyroscope data (in degrees per second) from two sensors placed on the left and right sides of a barbell during a set of squats. Analyze the rotational stability of the barbell. Look for imbalances, excessive tilting (uneven ascent/descent), or rotational twisting (bar path deviation). Provide a concise, 3-bullet-point form correction summary addressing any asymmetries or stability issues.`;

    const userMessage = `Here is the gyroscope data from a squat set (${latestReps} reps completed). Format: t[index]: L(gyroX, gyroY, gyroZ) R(gyroX, gyroY, gyroZ) — all values in degrees/s.\n\n${sensorDataStr}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userMessage }] }],
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errText);
      return new Response(
        JSON.stringify({ analysis: "AI analysis temporarily unavailable. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiResult = await geminiResponse.json();
    const analysis =
      geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Unable to generate analysis.";

    return new Response(JSON.stringify({ analysis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-form error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
