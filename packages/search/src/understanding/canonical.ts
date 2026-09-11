import { MODEL_ALIASES } from "@repo/catalogue";
import { FEATURES, type Feature } from "@repo/contracts";

export const AMBIGUOUS_MODELS: ReadonlySet<string> = new Set(["city"]);

export type Vocabulary = {
  makes: string[];
  models: Array<{ make: string; model: string }>;
  cities: string[];
  colors: string[];
  size: number;
  loadedAt: number;
};

const squash = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

export const ALIASES: Record<string, { make: string; model?: string }> =
  Object.fromEntries(
    Object.entries(MODEL_ALIASES).map(([key, value]) => [squash(key), value]),
  );

export const ALIAS_ENTRIES: Array<{
  text: string;
  alias: { make: string; model?: string };
}> = Object.entries(MODEL_ALIASES)
  .filter(([text]) => !AMBIGUOUS_MODELS.has(text.toLowerCase()))
  .map(([text, alias]) => ({ text, alias }));

export function flexPattern(text: string): string {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(String.raw`[^a-z0-9]*`);
}

export const CITY_ALIASES: Record<string, string> = {
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  blr: "Bengaluru",
  bombay: "Mumbai",
  madras: "Chennai",
  calcutta: "Kolkata",
  gurgaon: "Gurugram",
  newdelhi: "Delhi",
  delhincr: "Delhi",
  ncr: "Delhi",
  cochin: "Kochi",
  hyd: "Hyderabad",
};

export const COLOR_ALIASES: Record<string, string> = {
  gray: "grey",
  silvergrey: "silver",
  offwhite: "white",
  pearlwhite: "white",
  maroon: "red",
  wine: "red",
  navy: "blue",
  golden: "gold",
  beige: "brown",
};

const FEATURE_SYNONYMS: Array<[RegExp, Feature]> = [
  [/panoramic/, "panoramic sunroof"],
  [/sun\s*roof|moon\s*roof/, "sunroof"],
  [/(6|six)\s*air\s*bags?/, "6 airbags"],
  [/adas|driver assist|lane keep|collision/, "ADAS"],
  [/360/, "360 camera"],
  [/rear\s*(view)?\s*cam|reverse\s*cam|parking\s*cam/, "rear camera"],
  [/ventilated|cooled seats/, "ventilated seats"],
  [/leather/, "leather seats"],
  [/adaptive cruise/, "adaptive cruise control"],
  [/cruise/, "cruise control"],
  [/wireless charg/, "wireless charging"],
  [/car\s*play/, "Apple CarPlay"],
  [/android\s*auto/, "Android Auto"],
  [/touch\s*screen|infotainment/, "touchscreen"],
  [/isofix|child seat/, "ISOFIX"],
  [/rear\s*ac|rear\s*vents/, "rear AC vents"],
  [/climate control|auto(matic)? ac/, "automatic climate control"],
  [/keyless/, "keyless entry"],
  [/push\s*(button)?\s*start|start\s*stop button/, "push button start"],
  [/led/, "LED headlamps"],
  [/alloy/, "alloy wheels"],
  [/hill\s*(hold|assist|start)/, "hill hold assist"],
  [/\besc\b|stability control/, "ESC"],
  [/tpms|tyre pressure/, "TPMS"],
  [/fast\s*charg|dc charg/, "fast charging"],
  [/connected/, "connected car tech"],
  [/heads?\s*-?\s*up|hud/, "heads-up display"],
  [/premium audio|bose|jbl|harman|sony audio|speakers/, "premium audio"],
  [/electric tailgate|powered tailgate|power boot/, "electric tailgate"],
  [/captain/, "captain seats"],
];

export function canonicalMake(
  input: string,
  vocabulary: Vocabulary,
): string | null {
  const key = squash(input);
  if (!key) return null;

  const exact = vocabulary.makes.find((make) => squash(make) === key);
  if (exact) return exact;

  const alias = ALIASES[key];
  if (alias && !alias.model) return alias.make;

  const partial = vocabulary.makes.find(
    (make) => squash(make).includes(key) || key.includes(squash(make)),
  );
  return partial ?? null;
}

export function canonicalModel(
  input: string,
  vocabulary: Vocabulary,
): { make: string; model: string } | null {
  const key = squash(input);
  if (!key) return null;

  const alias = ALIASES[key];
  if (alias?.model) {
    const known = vocabulary.models.find(
      (entry) =>
        squash(entry.model) === squash(alias.model ?? "") &&
        squash(entry.make) === squash(alias.make),
    );
    return known ?? { make: alias.make, model: alias.model };
  }

  const exact = vocabulary.models.find((entry) => squash(entry.model) === key);
  if (exact) return exact;

  const withMake = vocabulary.models.find(
    (entry) => squash(`${entry.make} ${entry.model}`) === key,
  );
  if (withMake) return withMake;

  const partial = vocabulary.models.find(
    (entry) => key.length >= 4 && squash(entry.model).includes(key),
  );
  return partial ?? null;
}

export function canonicalCity(
  input: string,
  vocabulary: Vocabulary,
): string | null {
  const key = squash(input);
  if (!key) return null;

  const aliased = CITY_ALIASES[key];
  if (aliased) return aliased;

  return vocabulary.cities.find((city) => squash(city) === key) ?? null;
}

export function canonicalColor(
  input: string,
  vocabulary: Vocabulary,
): string | null {
  const key = squash(input);
  if (!key) return null;

  const aliased = COLOR_ALIASES[key] ?? key;
  return vocabulary.colors.find((color) => squash(color) === aliased) ?? null;
}

export function canonicalFeature(input: string): Feature | null {
  const lowered = input.toLowerCase().trim();

  const exact = FEATURES.find((feature) => feature.toLowerCase() === lowered);
  if (exact) return exact;

  for (const [pattern, feature] of FEATURE_SYNONYMS) {
    if (pattern.test(lowered)) return feature;
  }

  return null;
}

export { squash };
