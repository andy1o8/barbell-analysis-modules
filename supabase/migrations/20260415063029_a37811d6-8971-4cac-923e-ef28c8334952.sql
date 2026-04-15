
CREATE TABLE public.workout_telemetry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL,
  total_reps INTEGER NOT NULL DEFAULT 0,
  timestamp_ms BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts" ON public.workout_telemetry FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public reads" ON public.workout_telemetry FOR SELECT USING (true);
