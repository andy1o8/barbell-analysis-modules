import { useMemo } from "react";

type Status = "good" | "warning" | "neutral";

interface ZoneState {
  torso: Status;
  hips: Status;
  knees: Status;
  barbell: Status;
}

// Strict keyword mapping — exact substrings (lowercased) per zone
const TORSO_KEYWORDS = ["leaning forward", "torso angle"];
const BARBELL_KEYWORDS = ["barbell wobble", "asymmetrical twist"];
const HIP_KEYWORDS = ["hip shift"];
const KNEE_KEYWORDS = ["knee cave"];

const GOOD_KEYWORDS = [
  "good form",
  "form rating: good",
  "rating: good",
  "looks good",
  "no issues",
  "no major issues",
  "well balanced",
  "symmetrical",
  "stable",
  "solid form",
  "excellent",
];

function analyze(text: string): { zones: ZoneState; label: string; overall: Status } {
  const t = (text || "").toLowerCase();

  if (!t.trim()) {
    return {
      zones: { torso: "neutral", hips: "neutral", knees: "neutral", barbell: "neutral" },
      label: "Awaiting analysis",
      overall: "neutral",
    };
  }

  const hasTorso = TORSO_KEYWORDS.some((k) => t.includes(k));
  const hasBarbell = BARBELL_KEYWORDS.some((k) => t.includes(k));
  const hasHips = HIP_KEYWORDS.some((k) => t.includes(k));
  const hasKnee = KNEE_KEYWORDS.some((k) => t.includes(k));
  const hasGood = GOOD_KEYWORDS.some((k) => t.includes(k));
  const anyIssue = hasTorso || hasBarbell || hasHips || hasKnee;

  if (hasGood && !anyIssue) {
    return {
      zones: { torso: "good", hips: "good", knees: "good", barbell: "good" },
      label: "Form looks balanced",
      overall: "good",
    };
  }

  const zones: ZoneState = {
    torso: hasTorso ? "warning" : "neutral",
    hips: hasHips ? "warning" : "neutral",
    knees: hasKnee ? "warning" : "neutral",
    barbell: hasBarbell ? "warning" : "neutral",
  };

  const labels: string[] = [];
  if (hasTorso) labels.push("Torso angle");
  if (hasBarbell) labels.push("Barbell stability");
  if (hasHips) labels.push("Hip symmetry");
  if (hasKnee) labels.push("Knee tracking");

  return {
    zones,
    label: labels.length ? `Warning: ${labels.join(" • ")}` : "No specific issues detected",
    overall: anyIssue ? "warning" : "neutral",
  };
}

function color(status: Status, kind: "stroke" | "fill" = "stroke") {
  if (status === "warning") return kind === "stroke" ? "oklch(0.72 0.18 45)" : "oklch(0.72 0.18 45 / 0.18)";
  if (status === "good") return kind === "stroke" ? "oklch(0.65 0.2 150)" : "oklch(0.65 0.2 150 / 0.18)";
  return kind === "stroke" ? "oklch(0.6 0 0)" : "oklch(0.6 0 0 / 0.08)";
}

function glow(status: Status) {
  if (status === "warning") return "drop-shadow(0 0 6px oklch(0.72 0.18 45 / 0.65))";
  if (status === "good") return "drop-shadow(0 0 6px oklch(0.65 0.2 150 / 0.55))";
  return "none";
}

interface Props {
  analysisText: string;
}

export function BiomechanicsMap({ analysisText }: Props) {
  const { zones, label, overall } = useMemo(() => analyze(analysisText), [analysisText]);

  return (
    <details open className="group rounded-2xl border bg-card p-6 shadow-sm">
      <summary className="flex cursor-pointer items-center justify-between gap-3 list-none [&::-webkit-details-marker]:hidden">
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="uppercase tracking-wider text-xl sm:text-2xl font-bold text-foreground">
            Biomechanics Map
          </h3>
          <span
            className="text-xs font-medium px-3 py-1 rounded-full border self-start sm:self-auto"
            style={{
              color: color(overall, "stroke"),
              borderColor: color(overall, "stroke"),
              backgroundColor: color(overall, "fill"),
            }}
          >
            {label}
          </span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-2 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
        {/* Diagram */}
        <div className="relative w-full aspect-[4/3] rounded-xl bg-muted/30 border overflow-hidden">
          <svg viewBox="0 0 400 300" className="w-full h-full text-muted-foreground" xmlns="http://www.w3.org/2000/svg">
            {/* floor — uses currentColor so it adapts to light/dark theme; spans full viewBox width */}
            <line x1="20" y1="270" x2="380" y2="270" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="4 4" />

            {/* Centering wrapper — shifts the entire composition (figure + bar + pointers + labels) left so it sits dead-center within the card. All internal coordinates remain unchanged. */}
            <g transform="translate(-60, 0)">
              {/* Center of gravity guide — originates from barbell center (215,128), drops perfectly vertical through foot */}
              <line x1="215" y1="128" x2="215" y2="270" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="2 4" />

              {/* Foot — always neutral, never reflects knee warning */}
              <line x1="195" y1="270" x2="217" y2="270" stroke={color("neutral")} strokeWidth="5" strokeLinecap="round" />

              {/* ===== BASE SKELETON LAYER — structural lines only (no highlight circles) ===== */}

              {/* Leg lines — always neutral; only the knee joint circle reflects warning state */}
              <g>
                {/* Shin: ankle (210,268) → knee (195,220) */}
                <line x1="210" y1="268" x2="195" y2="220" stroke={color("neutral")} strokeWidth="6" strokeLinecap="round" />
                {/* Thigh: knee (195,220) → hip (225,180) — hips pushed back */}
                <line x1="195" y1="220" x2="225" y2="180" stroke={color("neutral")} strokeWidth="6" strokeLinecap="round" />
              </g>

              {/* Torso zone — spine, neck, head outline, arms */}
              {/* Spine — the only element that reflects torso warning state */}
              <g style={{ filter: glow(zones.torso) }}>
                <line x1="225" y1="180" x2="205" y2="130" stroke={color(zones.torso)} strokeWidth="7" strokeLinecap="round" />
              </g>

              {/* Neck + head + arms — always neutral, never reflect torso warning */}
              <g>
                <line x1="205" y1="130" x2="198" y2="115" stroke={color("neutral")} strokeWidth="3" strokeLinecap="round" />
                <circle cx="193" cy="100" r="13" fill="none" stroke={color("neutral")} strokeWidth="2.5" />
                {/* Bent arm pulling bar into traps: shoulder (205,130) → elbow (235,165) → hand (215,128) */}
                <line x1="205" y1="130" x2="235" y2="165" stroke={color("neutral")} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
                <line x1="235" y1="165" x2="215" y2="128" stroke={color("neutral")} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
              </g>

              {/* ===== HIGHLIGHT / GLOW LAYER — joint & barbell circles render last so they sit on top ===== */}

              {/* Knee joint */}
              <g style={{ filter: glow(zones.knees) }}>
                <circle cx="195" cy="220" r="7" fill={color(zones.knees, "fill")} stroke={color(zones.knees)} strokeWidth="2" />
              </g>

              {/* Hip joint */}
              <g style={{ filter: glow(zones.hips) }}>
                <circle cx="225" cy="180" r="10" fill={color(zones.hips, "fill")} stroke={color(zones.hips)} strokeWidth="2" />
              </g>

              {/* Barbell — concentric plate circles, top layer */}
              <g style={{ filter: glow(zones.barbell) }}>
                {/* Outer plate face — semi-transparent x-ray effect so head/neck remain visible */}
                <circle
                  cx="215"
                  cy="128"
                  r="16"
                  fill={color(zones.barbell, "fill")}
                  fillOpacity="0.25"
                  stroke={color(zones.barbell)}
                  strokeWidth="2"
                  strokeOpacity="0.6"
                  strokeDasharray="3 3"
                />
                {/* Mid plate ring — faint */}
                <circle cx="215" cy="128" r="10" fill="none" stroke={color(zones.barbell)} strokeWidth="1" opacity="0.5" />
                {/* Inner sleeve end — fully opaque, marks center of mass */}
                <circle cx="215" cy="128" r="4.5" fill={color(zones.barbell, "fill")} stroke={color(zones.barbell)} strokeWidth="2" />
                {/* Sleeve center dot */}
                <circle cx="215" cy="128" r="1.5" fill={color(zones.barbell)} />
              </g>

              {/* Pointer lines from labels to anatomical targets — currentColor adapts to theme */}
              <g stroke="currentColor" strokeOpacity="0.7" strokeWidth="0.75" strokeDasharray="2 2" fill="none">
                {/* Barbell → bar center (215,128) */}
                <line x1="290" y1="100" x2="231" y2="128" />
                {/* Torso / Back → mid-spine (~215, 155) */}
                <line x1="290" y1="150" x2="215" y2="155" />
                {/* Hips → hip joint (225, 180) */}
                <line x1="290" y1="195" x2="235" y2="180" />
                {/* Knees → knee joint (195, 220) */}
                <line x1="290" y1="235" x2="202" y2="220" />
              </g>

              {/* Zone labels — ordered top→bottom to match anatomy. Muted in light mode, white in dark mode for readability */}
              <g fontSize="9" fontFamily="ui-sans-serif, system-ui" className="fill-muted-foreground dark:fill-white">
                <text x="295" y="103">Barbell</text>
                <text x="295" y="153">Torso / Back</text>
                <text x="295" y="198">Hips</text>
                <text x="295" y="238">Knees</text>
              </g>
            </g>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex md:flex-col gap-3 md:gap-2 flex-wrap">
          <LegendRow label="Barbell" status={zones.barbell} />
          <LegendRow label="Torso / Back" status={zones.torso} />
          <LegendRow label="Hips" status={zones.hips} />
          <LegendRow label="Knees" status={zones.knees} />
        </div>
      </div>

      {!analysisText.trim() && (
        <p className="mt-4 text-xs text-muted-foreground">
          Run the AI Form Analysis above to highlight correctable zones.
        </p>
      )}
    </details>
  );
}

function LegendRow({ label, status }: { label: string; status: Status }) {
  const text =
    status === "warning" ? "Needs attention" : status === "good" ? "Good" : "Neutral";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{
          backgroundColor: color(status, "stroke"),
          boxShadow: status !== "neutral" ? `0 0 8px ${color(status, "stroke")}` : "none",
        }}
      />
      <span className="text-foreground font-medium">{label}</span>
      <span className="text-muted-foreground">— {text}</span>
    </div>
  );
}
