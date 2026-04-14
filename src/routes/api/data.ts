import { createFileRoute } from "@tanstack/react-router";
import { pushSensorData, updateSession, getSession, type SensorReading } from "@/lib/sensor-store";

// REST endpoint for RPi to POST sensor data
// POST /api/data with JSON body: { reps?: number, readings?: SensorReading[] }
// GET /api/data to poll current session

export const Route = createFileRoute("/api/data")({
  server: {
    handlers: {
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: corsHeaders(),
        });
      },

      GET: async () => {
        const session = getSession();
        return Response.json(session, { headers: corsHeaders() });
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json();

          if (typeof body.reps === "number") {
            updateSession({ reps: body.reps });
          }

          if (Array.isArray(body.readings)) {
            for (const reading of body.readings as SensorReading[]) {
              pushSensorData(reading);
            }
          }

          return Response.json({ success: true }, { headers: corsHeaders() });
        } catch (error) {
          return Response.json(
            { error: "Invalid request body" },
            { status: 400, headers: corsHeaders() }
          );
        }
      },
    },
  },
});

function corsHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
