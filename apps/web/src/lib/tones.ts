import type { CSSProperties } from "react";
import type { FuelType } from "./types";

export const TONES = [
  "brand",
  "petrol",
  "diesel",
  "electric",
  "cng",
  "hybrid",
  "sun",
  "rose",
  "grass",
] as const;

export type Tone = (typeof TONES)[number];


export const SOFT: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  petrol: "bg-petrol-soft text-petrol",
  diesel: "bg-diesel-soft text-diesel",
  electric: "bg-electric-soft text-electric",
  cng: "bg-cng-soft text-cng",
  hybrid: "bg-hybrid-soft text-hybrid",
  sun: "bg-sun-soft text-sun",
  rose: "bg-rose-soft text-rose",
  grass: "bg-grass-soft text-grass",
};

export const TEXT: Record<Tone, string> = {
  brand: "text-brand",
  petrol: "text-petrol",
  diesel: "text-diesel",
  electric: "text-electric",
  cng: "text-cng",
  hybrid: "text-hybrid",
  sun: "text-sun",
  rose: "text-rose",
  grass: "text-grass",
};

export const DOT: Record<Tone, string> = {
  brand: "bg-brand",
  petrol: "bg-petrol",
  diesel: "bg-diesel",
  electric: "bg-electric",
  cng: "bg-cng",
  hybrid: "bg-hybrid",
  sun: "bg-sun",
  rose: "bg-rose",
  grass: "bg-grass",
};

export const FUEL_TONE: Record<FuelType, Tone> = {
  PETROL: "petrol",
  DIESEL: "diesel",
  ELECTRIC: "electric",
  CNG: "cng",
  HYBRID: "hybrid",
};

export function toneStyle(tone: Tone): CSSProperties {
  return {
    "--tone": `var(--${tone})`,
    "--tone-soft": `var(--${tone}-soft)`,
  } as CSSProperties;
}

export function safetyTone(stars: number): Tone {
  if (stars >= 5) return "grass";
  if (stars >= 4) return "electric";
  if (stars >= 3) return "sun";
  return "rose";
}
