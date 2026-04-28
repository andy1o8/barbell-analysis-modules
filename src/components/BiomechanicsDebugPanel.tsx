import { Button } from "@/components/ui/button";

interface Props {
  setAnalysis: (value: string) => void;
}

const TESTS: { label: string; text: string }[] = [
  { label: "Test Torso", text: "Debug: detected leaning forward with poor torso angle on descent." },
  { label: "Test Barbell", text: "Debug: noticeable barbell wobble and asymmetrical twist throughout the set." },
  { label: "Test Hips", text: "Debug: clear hip shift to one side at the bottom of the squat." },
  { label: "Test Knees", text: "Debug: visible knee cave during the ascent of each rep." },
];

export function BiomechanicsDebugPanel({ setAnalysis }: Props) {
  return (
    <div className="rounded-2xl border border-dashed bg-muted/20 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Debug Controls
        </span>
        <span className="text-[10px] text-muted-foreground">(temporary — verify SVG zone highlights)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {TESTS.map((t) => (
          <Button
            key={t.label}
            size="sm"
            variant="outline"
            onClick={() => setAnalysis(t.text)}
          >
            {t.label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setAnalysis("")}>
          Clear All
        </Button>
      </div>
    </div>
  );
}
