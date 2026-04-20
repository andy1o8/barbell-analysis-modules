import type { LoggedSet } from "@/components/RepCounter";

export function SetTracker({ loggedSets }: { loggedSets: LoggedSet[] }) {
  const totalReps = loggedSets.reduce((sum, s) => sum + s.reps, 0);

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="uppercase tracking-wider text-xl sm:text-2xl font-bold text-foreground whitespace-nowrap">
          Set Tracker
        </h3>
        {loggedSets.length > 0 && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {loggedSets.length} {loggedSets.length === 1 ? "set" : "sets"} · {totalReps} reps
          </p>
        )}
      </div>

      {loggedSets.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No sets logged yet — finish a set and tap “Log Set”.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {loggedSets.map((s) => (
            <div
              key={s.setNumber}
              className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground"
            >
              <span className="text-muted-foreground">Set {s.setNumber}:</span>
              <span className="tabular-nums">{s.reps} reps</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
