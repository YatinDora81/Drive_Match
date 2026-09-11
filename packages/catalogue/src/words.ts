import type { BodyType, FuelType } from "@repo/contracts";

const BODY_WORDS: Record<BodyType, string> = {
  HATCHBACK: "hatchback",
  SEDAN: "sedan",
  SUV: "SUV",
  MPV: "MPV",
  COUPE: "coupe",
  PICKUP: "pickup truck",
};

const FUEL_WORDS: Record<FuelType, string> = {
  PETROL: "petrol",
  DIESEL: "diesel",
  CNG: "CNG",
  ELECTRIC: "electric",
  HYBRID: "hybrid",
};

const OWNER_WORDS = ["first", "second", "third", "fourth", "fifth"];

export const bodyWord = (bodyType: BodyType): string => BODY_WORDS[bodyType];

export const fuelWord = (fuelType: FuelType): string => FUEL_WORDS[fuelType];

export const ownerWord = (count: number): string =>
  OWNER_WORDS[count - 1] ?? `${count}th`;

export const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);
