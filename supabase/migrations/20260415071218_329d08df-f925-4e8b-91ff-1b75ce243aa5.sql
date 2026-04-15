CREATE POLICY "Allow public deletes"
ON public.workout_telemetry
FOR DELETE
TO public
USING (true);