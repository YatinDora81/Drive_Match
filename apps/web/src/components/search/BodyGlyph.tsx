import type { BodyType } from "../../lib/types";

const OUTLINES: Record<BodyType, string> = {
  HATCHBACK: "M6 34h84V22l-7-10H36L22 22 6 26z M24 22h58",
  SEDAN: "M6 34h84v-8l-16-3-10-11H32L20 23 6 26z M24 23h48 M48 12v11",
  SUV: "M6 34h84V20l-6-11H30L16 20H6z M20 20h64 M44 9v11",
  MPV: "M6 34h84V22l-8-14H26L10 24l-4 6z M14 22h72 M40 8v14 M64 8v14",
  COUPE: "M6 34h84v-7l-14-5-16-9H38L22 24 6 28z M26 24h46",
  PICKUP: "M6 34h84V20H54V10H30L16 22H6z M54 20v14 M22 22h28",
};

const HUES: Record<string, number | "white" | "black" | "grey"> = {
  white: "white",
  pearl: "white",
  ivory: "white",
  black: "black",
  silver: "grey",
  grey: "grey",
  gray: "grey",
  graphite: "grey",
  titanium: "grey",
  red: 12,
  maroon: 4,
  wine: 350,
  orange: 32,
  yellow: 62,
  gold: 52,
  beige: 68,
  champagne: 60,
  brown: 36,
  bronze: 40,
  copper: 28,
  green: 140,
  olive: 95,
  teal: 178,
  blue: 228,
  navy: 236,
  sky: 205,
  purple: 292,
  violet: 280,
  magenta: 320,
};

function hashHue(value: string): number {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

export function swatchFor(color: string): string {
  const word = color.trim().toLowerCase();
  const key = Object.keys(HUES).find((name) => word.includes(name));
  const hue = key === undefined ? hashHue(word) : HUES[key];

  if (hue === "white") return "color-mix(in oklab, var(--surface-2) 72%, #ffffff)";
  if (hue === "black") return "color-mix(in oklab, var(--surface-2) 74%, #000000)";
  if (hue === "grey") return "color-mix(in oklab, var(--surface-2) 74%, #8a8a8a)";
  return `color-mix(in oklab, var(--surface-2) 76%, hsl(${hue} 65% 55%))`;
}

type Props = { bodyType: BodyType; color: string; className?: string };

export function BodyGlyph({ bodyType, color, className = "" }: Props) {
  return (
    <div
      aria-hidden="true"
      style={{ background: swatchFor(color) }}
      className={`grid aspect-[4/3] w-full place-items-center border-b border-line text-body ${className}`}
    >
      <svg
        viewBox="0 0 96 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-auto w-[58%] opacity-70"
      >
        <path d={OUTLINES[bodyType] ?? OUTLINES.SEDAN} />
        <circle cx="26" cy="36" r="6" fill="var(--card)" />
        <circle cx="70" cy="36" r="6" fill="var(--card)" />
      </svg>
    </div>
  );
}
