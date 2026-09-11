import type { ComponentType } from "react";
import type { Tone } from "../../lib/tones";
import {
  BoltIcon,
  CarIcon,
  DropIcon,
  GridIcon,
  RupeeIcon,
  SeatIcon,
  ShieldIcon,
} from "../icons";

export type Preset = {
  query: string;
  title: string;
  tone: Tone;
  Icon: ComponentType<{ className?: string }>;
};

export const IDEAS: readonly Preset[] = [
  { query: "Show SUVs under ₹15L", title: "SUVs under ₹15L", tone: "brand", Icon: CarIcon },
  {
    query: "Family cars with high safety ratings",
    title: "Safe family cars",
    tone: "grass",
    Icon: ShieldIcon,
  },
  {
    query: "Diesel automatic cars below 80k km",
    title: "Diesel automatic",
    tone: "diesel",
    Icon: DropIcon,
  },
  {
    query: "Electric SUV with range above 400 km",
    title: "Electric, long range",
    tone: "electric",
    Icon: BoltIcon,
  },
  {
    query: "Cheapest automatic hatchback in Bengaluru",
    title: "Cheapest automatic",
    tone: "sun",
    Icon: RupeeIcon,
  },
  {
    query: "First owner 7 seater under 20 lakh",
    title: "7 seaters, one owner",
    tone: "hybrid",
    Icon: SeatIcon,
  },
];

export const BROWSE: readonly Preset[] = [
  { query: "Show me all cars, newest first", title: "All cars", tone: "hybrid", Icon: GridIcon },
  { query: "Cheapest cars under 8 lakh", title: "Under ₹8 lakh", tone: "sun", Icon: RupeeIcon },
  { query: "Electric cars", title: "Electric only", tone: "electric", Icon: BoltIcon },
  { query: "7 seater cars", title: "7 seaters", tone: "cng", Icon: SeatIcon },
  {
    query: "Cars with a 5 star safety rating",
    title: "5★ safety",
    tone: "grass",
    Icon: ShieldIcon,
  },
];

export const PLACEHOLDERS: readonly string[] = [
  "Family SUV under ₹15L with a sunroof",
  "Automatic hatchback in Pune, first owner",
  "Diesel 7 seater below 80,000 km",
  "Electric car with 400 km range",
];
