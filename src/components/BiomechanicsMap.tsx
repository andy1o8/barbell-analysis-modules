import { useMemo } from "react";

type Status = "good" | "warning" | "neutral";

interface ZoneState {
  torso: Status;
  hips: Status;
  knees: Status;
  barbell: Status;
}

const PITCH_KEYWORDS = [
  "chest fall",
  "chest falling",
  "chest down",
  "leaning forward",
  "lean forward",
  "forward lean",
  "pitch",
  "torso angle",
  "back angle",
  "good morning",
  "rounding",
  "rounded back",
  "hips rise",
  "hips shoot",
];

const YAW_KEYWORDS = [
  "asymmetr",
  "twist",
  "wobble",
  "yaw",
  "uneven",
  "tilt",
  "tilting",
  "rotation",
  "imbalance",
  "shift",
  "lateral",
  "left side",
  "right side",
  "one side",
];

const KNEE_KEYWORDS = [
  "knee",
  "knees cav",
  "valgus",
  "knees in",
  "knees out",
];

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

  const hasPitch = PITCH_KEYWORDS.some((k) => t.includes(k));
  const hasYaw = YAW_KEYWORDS.some((k) => t.includes(k));
  const hasKnee = KNEE_KEYWORDS.some((k) => t.includes(k));
  const hasGood = GOOD_KEYWORDS.some((k) => t.includes(k));
  const anyIssue = hasPitch || hasYaw || hasKnee;

  if (hasGood && !anyIssue) {
    return {
      zones: { torso: "good", hips: "good", knees: "good", barbell: "good" },
      label: "Form looks balanced",
      overall: "good",
    };
  }

  const zones: ZoneState = {
    torso: hasPitch ? "warning" : "neutral",
    hips: hasYaw ? "warning" : "neutral",
    knees: hasKnee ? "warning" : "neutral",
    barbell: hasYaw ? "warning" : "neutral",
  };

  const labels: string[] = [];
  if (hasPitch) labels.push("Torso angle");
  if (hasYaw) labels.push("Bar / hip symmetry");
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
            {/* floor — uses currentColor so it adapts to light/dark theme */}
            <line x1="20" y1="270" x2="380" y2="270" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1" strokeDasharray="4 4" />

            {/* Center of gravity guide (vertical line through mid-foot & bar) */}
            <line x1="206" y1="120" x2="206" y2="270" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="2 4" />

            {/* Foot (side profile, facing right: toes at x=192, heel just behind ankle at x=220; mid-foot x=206 aligns with COG line) */}
            <line x1="192" y1="270" x2="220" y2="270" stroke={color(zones.knees)} strokeWidth="5" strokeLinecap="round" />

            {/* Knees zone — shin (ankle→knee) + thigh (knee→hip). Knee tracks slightly over toes. */}
            <g style={{ filter: glow(zones.knees) }}>
              {/* Shin: ankle (210,268) → knee (195,220) */}
              <line x1="210" y1="268" x2="195" y2="220" stroke={color(zones.knees)} strokeWidth="6" strokeLinecap="round" />
              {/* Thigh: knee (195,220) → hip (225,180) — hips pushed back */}
              <line x1="195" y1="220" x2="225" y2="180" stroke={color(zones.knees)} strokeWidth="6" strokeLinecap="round" />
              {/* Knee joint */}
              <circle cx="195" cy="220" r="7" fill={color(zones.knees, "fill")} stroke={color(zones.knees)} strokeWidth="2" />
            </g>

            {/* Hips zone */}
            <g style={{ filter: glow(zones.hips) }}>
              <circle cx="225" cy="180" r="10" fill={color(zones.hips, "fill")} stroke={color(zones.hips)} strokeWidth="2" />
            </g>

            {/* Torso zone — leans forward so shoulders sit over mid-foot. Hip(225,180) → shoulder(205,130) */}
            <g style={{ filter: glow(zones.torso) }}>
              <line x1="225" y1="180" x2="205" y2="130" stroke={color(zones.torso)} strokeWidth="7" strokeLinecap="round" />
              {/* Neck + head (slightly forward of shoulders) */}
              <line x1="205" y1="130" x2="198" y2="115" stroke={color(zones.torso)} strokeWidth="3" strokeLinecap="round" />
              <circle cx="193" cy="100" r="13" fill="none" stroke={color(zones.torso)} strokeWidth="2.5" />
              {/* Bent arm pulling bar into traps: shoulder (205,130) → elbow (235,165, down & back) → hand (215,128, at bar center) */}
              <line x1="205" y1="130" x2="235" y2="165" stroke={color(zones.torso)} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
              <line x1="235" y1="165" x2="215" y2="128" stroke={color(zones.torso)} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
            </g>

            {/* Barbell zone — side-profile: concentric circles centered on the traps (just below neck line) */}
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
