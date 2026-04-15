interface RepCounterProps {
  reps: number;
  lastUpdated: string;
}

export function RepCounter({ reps, lastUpdated }: RepCounterProps) {
  const timeAgo = getTimeAgo(lastUpdated);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-8 shadow-sm">
      <p className="text-lg font-bold text-foreground uppercase tracking-wider">Reps Completed</p>
      <p className="mt-3 text-7xl font-bold tabular-nums text-foreground">{reps}</p>
      <p className="mt-3 text-xs text-muted-foreground">Updated {timeAgo}</p>
    </div>
  );
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 5000) return "just now";
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}
