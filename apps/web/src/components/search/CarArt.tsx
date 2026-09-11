import type { ReactNode } from "react";
import type { BodyType } from "../../lib/types";

type Box = { x: number; y: number; w: number; h: number };

type Shape = {
  body: Box;
  cabin: string;
  wheels: readonly [number, number];
  extra?: ReactNode;
};

const TALL = { y: 29, h: 17 };
const MID = { y: 31, h: 14 };
const LOW = { y: 32, h: 12 };

const SHAPES: Record<BodyType, Shape> = {
  SEDAN: {
    body: { x: 7, w: 106, ...MID },
    cabin:
      "M25 31 L38.5 17.2 Q39.8 16 41.6 16 L70.4 16 Q72.4 16 74 17.2 L91 31 Z",
    wheels: [30, 90],
  },
  HATCHBACK: {
    body: { x: 13, w: 95, ...MID },
    cabin: "M17 31 L21.2 16.4 Q21.7 15 23.4 15 L64.6 15 Q66.8 15 68.3 16.3 L86 31 Z",
    wheels: [32, 88],
  },
  COUPE: {
    body: { x: 7, w: 106, ...LOW },
    cabin: "M27 32 Q38 20.6 51.5 19.2 L64 19 Q68 19 71.2 20.8 L93 32 Z",
    wheels: [30, 90],
  },
  SUV: {
    body: { x: 8, w: 104, ...TALL },
    cabin: "M13 29 L16.4 13.6 Q16.8 12 18.6 12 L70.8 12 Q73 12 74.6 13.4 L91 29 Z",
    wheels: [30, 89],
    extra: <rect x="22" y="9" width="44" height="1.8" rx="0.9" opacity={0.38} />,
  },
  MPV: {
    body: { x: 6, w: 108, ...TALL },
    cabin: "M9.5 29 L12.2 12.8 Q12.6 11 14.6 11 L77.6 11 Q80.2 11 81.9 12.6 L99 29 Z",
    wheels: [28, 92],
  },
  PICKUP: {
    body: { x: 6, w: 108, ...TALL },
    cabin: "M59 29 L61 14.5 Q61.3 13 63 13 L79 13 Q81.2 13 82.8 14.4 L97 29 Z",
    wheels: [28, 92],
    extra: (
      <path
        d="M9.5 29 V22.6 H54.5 V29"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.38}
      />
    ),
  },
};

export function CarArt({ bodyType, className }: { bodyType: BodyType; className?: string }) {
  const shape = SHAPES[bodyType] ?? SHAPES.SEDAN;
  const { body, cabin, wheels, extra } = shape;
  const wheelY = body.y + body.h + 1;
  const front = body.x + body.w;

  return (
    <svg
      viewBox="0 0 120 62"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <ellipse cx="60" cy={wheelY + 9.5} rx="52" ry="3" opacity={0.12} />
      {extra}
      <path d={cabin} opacity={0.38} />
      <rect x={body.x} y={body.y} width={body.w} height={body.h} rx="7" />
      <rect
        x={front - 6.5}
        y={body.y + 3.2}
        width="4"
        height="2.6"
        rx="1.3"
        fill="var(--tone-soft)"
      />
      <rect
        x={body.x + 2.2}
        y={body.y + 3.2}
        width="2.6"
        height="2.6"
        rx="1.3"
        fill="var(--tone-soft)"
        opacity={0.7}
      />
      {wheels.map((cx) => (
        <g key={cx}>
          <circle
            cx={cx}
            cy={wheelY}
            r="9"
            stroke="var(--tone-soft)"
            strokeWidth="2.2"
          />
          <circle cx={cx} cy={wheelY} r="3.4" fill="var(--tone-soft)" />
        </g>
      ))}
    </svg>
  );
}
