import type { LoggedSet } from "@/components/RepCounter";

interface SetTrackerProps {
  loggedSets: LoggedSet[];
  onWeightChange: (setNumber: number, weight: string) => void;
}

export function SetTracker({ loggedSets, onWeightChange }: SetTrackerProps) {
  const totalReps = loggedSets.reduce((sum, s) => sum + s.reps, 0);

  return (
    <details className="group rounded-2xl border bg-card p-6 shadow-sm">
      <summary className="flex cursor-pointer items-center justify-between gap-3 list-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-3">
          <h3 className="uppercase tracking-wider text-xl sm:text-2xl font-bold text-foreground whitespace-nowrap">
            Set Tracker
          </h3>
          {loggedSets.length > 0 && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {loggedSets.length} {loggedSets.length === 1 ? "set" : "sets"} · {totalReps} reps
            </p>
          )}
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>

      {loggedSets.length === 0 ? (
        <p className="mt-4 py-8 text-center text-sm text-muted-foreground">
          No sets logged yet — finish a set and tap “Log Set”.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {loggedSets.map((s) => (
            <div
              key={s.setNumber}
              className="flex flex-row items-center justify-start gap-6 rounded-xl border border-border bg-muted/40 p-4 text-foreground"
            >
              <span className="text-lg sm:text-xl font-medium text-muted-foreground">
                Set {s.setNumber}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={s.weight}
                  onChange={(e) => onWeightChange(s.setNumber, e.target.value)}
                  className="w-20 rounded-md border border-border bg-background/60 px-2 py-1.5 text-center text-lg sm:text-xl font-semibold tabular-nums text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-sm sm:text-base font-medium text-muted-foreground">lbs</span>
              </div>
              <span className="text-lg sm:text-xl font-bold tabular-nums">
                {s.reps} reps
              </span>
            </div>
          ))}
        </div>
      )}
    </details>
  );
}
