import { FEATURES, type Feature } from "@repo/contracts";
import type { Tier, TrimLevel } from "./models.ts";
import type { Rng } from "./random.ts";
import type { Draft } from "./types.ts";

export type FeatureContext = Draft & {
  tier: Tier;
  level: TrimLevel;
  never: readonly Feature[];
  featureFrom: Partial<Record<Feature, number>>;
};

type Rule = {
  feature: Feature;
  when?: (c: FeatureContext) => boolean;
  requires?: Feature;
  excludes?: Feature;
  chance: number | ((c: FeatureContext) => number);
};

const MIN_FEATURES = 3;
const MAX_FEATURES = 9;

const ESSENTIALS: readonly Feature[] = [
  "captain seats",
  "fast charging",
  "touchscreen",
  "Android Auto",
  "Apple CarPlay",
  "rear camera",
];

const DISTINCTIVE: readonly Feature[] = [
  "sunroof",
  "panoramic sunroof",
  "ADAS",
  "adaptive cruise control",
  "6 airbags",
  "360 camera",
  "ventilated seats",
  "leather seats",
  "heads-up display",
  "electric tailgate",
  "premium audio",
  "wireless charging",
];

const OPT_IN: readonly Feature[] = ["ADAS", "heads-up display"];

const luxury = (c: FeatureContext): boolean => c.tier === "luxury";
const premium = (c: FeatureContext): boolean => luxury(c) || c.tier === "premium";
const notBudget = (c: FeatureContext): boolean => c.tier !== "budget";
const top = (c: FeatureContext): boolean => c.level === "top";
const midUp = (c: FeatureContext): boolean => c.level !== "base";
const suv = (c: FeatureContext): boolean => c.bodyType === "SUV";
const threeRow = (c: FeatureContext): boolean => c.seats >= 6;
const declared = (c: FeatureContext, feature: Feature): boolean =>
  c.featureFrom[feature] !== undefined;

const RULES: readonly Rule[] = [
  { feature: "captain seats", when: (c) => c.seats === 6, chance: 1 },
  { feature: "fast charging", when: (c) => c.fuelType === "ELECTRIC", chance: 0.9 },
  {
    feature: "panoramic sunroof",
    when: (c) => top(c) && premium(c) && c.year >= 2021 && (suv(c) || luxury(c)),
    chance: 0.5,
  },
  {
    feature: "sunroof",
    excludes: "panoramic sunroof",
    when: (c) =>
      notBudget(c) &&
      (suv(c) || premium(c) || declared(c, "sunroof")) &&
      (top(c) || (midUp(c) && c.year >= 2020)),
    chance: (c) => (top(c) ? 0.75 : 0.35),
  },
  {
    feature: "ADAS",
    when: (c) => c.year >= 2022 && (top(c) || luxury(c)),
    chance: 0.75,
  },
  { feature: "adaptive cruise control", requires: "ADAS", chance: 0.85 },
  {
    feature: "6 airbags",
    when: (c) =>
      luxury(c) ||
      (c.year >= 2023 && notBudget(c)) ||
      (premium(c) && top(c) && c.year >= 2021),
    chance: (c) => (luxury(c) ? 1 : c.year >= 2023 ? 0.8 : 0.5),
  },
  {
    feature: "360 camera",
    when: (c) =>
      c.year >= 2021 && top(c) && (premium(c) || declared(c, "360 camera")),
    chance: 0.65,
  },
  {
    feature: "ventilated seats",
    when: (c) => c.year >= 2020 && top(c) && premium(c),
    chance: 0.6,
  },
  {
    feature: "leather seats",
    when: (c) => luxury(c) || (premium(c) && top(c)),
    chance: (c) => (luxury(c) ? 0.9 : 0.55),
  },
  { feature: "heads-up display", when: top, chance: 0.35 },
  {
    feature: "electric tailgate",
    when: (c) =>
      top(c) &&
      (luxury(c) || (premium(c) && (suv(c) || threeRow(c)) && c.year >= 2021)),
    chance: 0.4,
  },
  { feature: "premium audio", when: (c) => top(c) && premium(c), chance: 0.45 },
  {
    feature: "wireless charging",
    when: (c) => c.year >= 2021 && top(c) && notBudget(c),
    chance: 0.5,
  },
  {
    feature: "connected car tech",
    when: (c) => c.year >= 2019 && (premium(c) ? midUp(c) : top(c)),
    chance: 0.5,
  },
  {
    feature: "cruise control",
    when: (c) => midUp(c) && notBudget(c),
    chance: (c) => (top(c) ? 0.85 : 0.6),
  },
  {
    feature: "ESC",
    when: (c) => luxury(c) || (c.year >= 2020 && (premium(c) || top(c))),
    chance: (c) => (luxury(c) ? 1 : 0.7),
  },
  { feature: "TPMS", when: (c) => c.year >= 2021 && midUp(c), chance: 0.55 },
  {
    feature: "ISOFIX",
    chance: (c) => (luxury(c) ? 1 : c.year >= 2019 ? 0.75 : 0.15),
  },
  {
    feature: "LED headlamps",
    when: (c) =>
      (top(c) && c.year >= 2018) || (c.year >= 2021 && premium(c) && midUp(c)),
    chance: 0.7,
  },
  {
    feature: "automatic climate control",
    when: (c) => midUp(c) && notBudget(c),
    chance: 0.75,
  },
  {
    feature: "rear AC vents",
    when: (c) => midUp(c) && c.bodyType !== "HATCHBACK",
    chance: (c) => (threeRow(c) ? 0.9 : 0.7),
  },
  {
    feature: "hill hold assist",
    when: (c) => c.year >= 2019 && (c.transmission === "AUTOMATIC" || suv(c)),
    chance: 0.6,
  },
  {
    feature: "push button start",
    when: (c) => c.year >= 2018 && midUp(c) && notBudget(c),
    chance: 0.7,
  },
  { feature: "keyless entry", when: midUp, chance: 0.7 },
  {
    feature: "alloy wheels",
    when: (c) => top(c) || (midUp(c) && notBudget(c)),
    chance: 0.8,
  },
  {
    feature: "Android Auto",
    when: (c) => c.year >= 2019 && (midUp(c) || luxury(c)),
    chance: 0.85,
  },
  { feature: "Apple CarPlay", requires: "Android Auto", chance: 0.95 },
  {
    feature: "rear camera",
    when: (c) => midUp(c) || luxury(c),
    chance: (c) => (luxury(c) ? 1 : 0.85),
  },
  {
    feature: "touchscreen",
    when: (c) =>
      luxury(c) || midUp(c) || c.year >= 2022 || (premium(c) && c.year >= 2018),
    chance: (c) =>
      luxury(c) || (midUp(c) && (premium(c) || c.year >= 2020)) ? 1 : 0.85,
  },
];

const REQUIRES = new Map(
  RULES.flatMap((rule) =>
    rule.requires ? [[rule.feature, rule.requires] as const] : [],
  ),
);

const FILLERS: readonly Feature[] = [
  "touchscreen",
  "rear camera",
  "alloy wheels",
  "keyless entry",
  "hill hold assist",
];

export function pickFeatures(rng: Rng, context: FeatureContext): Feature[] {
  const picked = new Set<Feature>();

  for (const rule of RULES) {
    if (!offered(context, rule.feature)) continue;
    if (rule.when && !rule.when(context)) continue;
    if (rule.requires && !picked.has(rule.requires)) continue;
    if (rule.excludes && picked.has(rule.excludes)) continue;

    const chance =
      typeof rule.chance === "number" ? rule.chance : rule.chance(context);

    if (rng.chance(chance)) picked.add(rule.feature);
  }

  for (const filler of FILLERS) {
    if (picked.size >= MIN_FEATURES) break;
    picked.add(filler);
  }

  return capped(rng, picked).sort(
    (a, b) => FEATURES.indexOf(a) - FEATURES.indexOf(b),
  );
}

function offered(c: FeatureContext, feature: Feature): boolean {
  if (c.never.includes(feature)) return false;

  const since = c.featureFrom[feature];

  return since === undefined ? !OPT_IN.includes(feature) : c.year >= since;
}

function capped(rng: Rng, picked: ReadonlySet<Feature>): Feature[] {
  if (picked.size <= MAX_FEATURES) return [...picked];

  const kept = new Set(ESSENTIALS.filter((feature) => picked.has(feature)));
  const extras = rng.shuffle([...picked].filter((feature) => !kept.has(feature)));
  const rank = (feature: Feature): number =>
    (DISTINCTIVE.includes(feature) ? 0 : 2) + (REQUIRES.has(feature) ? 1 : 0);

  for (const feature of extras.sort((a, b) => rank(a) - rank(b))) {
    if (kept.size >= MAX_FEATURES) break;

    const requires = REQUIRES.get(feature);
    if (requires && !kept.has(requires)) continue;

    kept.add(feature);
  }

  return [...kept];
}
