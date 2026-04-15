

## Plan: Real-time Rep Counter from Database

### What changes

1. **Enable Realtime on `workout_telemetry` table** — Run a migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_telemetry;`

2. **Update `RepCounter` component** — Replace the props-based counter with a self-contained component that:
   - On mount, queries `workout_telemetry` for the max `total_reps` using the Supabase client (`select('total_reps').order('total_reps', { ascending: false }).limit(1)`)
   - Subscribes to Supabase Realtime `postgres_changes` on `workout_telemetry` (INSERT events)
   - On each new row, updates the displayed count if `total_reps` is higher than current
   - Cleans up the subscription on unmount

3. **Update `index.tsx`** — Remove the `reps` and `lastUpdated` props from `RepCounter` since it will be self-contained. Keep the rest of the dashboard (sensor data, form analysis) unchanged.

### Technical details

- Uses the browser Supabase client (`@/integrations/supabase/client`) — no auth needed since RLS allows public reads
- Realtime channel: `channel('workout-reps')` listening for `INSERT` on `public.workout_telemetry`
- The counter displays `MAX(total_reps)` — each webhook POST includes the cumulative total, so we just need the highest value
- `lastUpdated` will come from the `created_at` of the row with the highest `total_reps`

