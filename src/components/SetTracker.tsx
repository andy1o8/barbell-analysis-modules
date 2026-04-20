import type { LoggedSet } from "@/components/RepCounter";

export function SetTracker({ loggedSets }: { loggedSets: LoggedSet[] }) {
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
        <div className="mt-4 flex flex-wrap gap-2">
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
    </details>
  );
}
