import type { ParsedQuery, SearchFilters, SearchSort } from "@repo/contracts";
import { normalizeParse } from "./normalize.ts";
import {
  ALIAS_ENTRIES,
  ALIASES,
  AMBIGUOUS_MODELS,
  CITY_ALIASES,
  COLOR_ALIASES,
  canonicalCity,
  canonicalColor,
  canonicalFeature,
  canonicalMake,
  canonicalModel,
  flexPattern,
  type Vocabulary,
} from "./canonical.ts";

const NUM = String.raw`(\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+(?:\.\d+)?)`;
const PRICE_UNIT = String.raw`(lakhs?|lacs?|lkh|l|crores?|cr|k|thousand|million|mn|m)?`;
const CURRENCY = String.raw`(?:rs\.?|₹|inr)?\s*`;
const MAX_WORDS = String.raw`(?:not (?:above|over|more than|exceeding)|no more than|not more than|under|below|less than|lesser than|cheaper than|upto|up to|within|max(?:imum)?|at most|<=?)`;
const MIN_WORDS = String.raw`(?:not (?:below|under|less than)|no less than|above|over|more than|greater than|at least|min(?:imum)?|starting(?: at| from)?|>=?)`;
const AROUND_WORDS = String.raw`(?:around|about|approx(?:imately)?|roughly|near|close to|~)`;

const UNIT_MULTIPLIER: Record<string, number> = {
  l: 1e5,
  lakh: 1e5,
  lakhs: 1e5,
  lac: 1e5,
  lacs: 1e5,
  lkh: 1e5,
  cr: 1e7,
  crore: 1e7,
  crores: 1e7,
  k: 1e3,
  thousand: 1e3,
  m: 1e6,
  mn: 1e6,
  million: 1e6,
};

type Work = {
  text: string;
  filters: SearchFilters;
  sort: SearchSort | null;
  found: string[];
};

const toNumber = (raw: string): number => Number(raw.replace(/,/g, ""));

const money = (raw: string, unit: string | undefined): number => {
  const value = toNumber(raw);
  if (unit) return Math.round(value * (UNIT_MULTIPLIER[unit.toLowerCase()] ?? 1));
  return value <= 500 ? Math.round(value * 1e5) : Math.round(value);
};

const kilometres = (raw: string, unit: string | undefined): number => {
  const value = toNumber(raw);
  if (unit) return Math.round(value * 1_000);
  return value < 1_000 ? Math.round(value * 1_000) : Math.round(value);
};

function consume(
  work: Work,
  pattern: RegExp,
  onMatch: (match: RegExpExecArray) => void,
): void {
  const regex = new RegExp(
    pattern.source,
    pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`,
  );
  let match: RegExpExecArray | null;
  const spans: Array<[number, number]> = [];

  while ((match = regex.exec(work.text)) !== null) {
    onMatch(match);
    spans.push([match.index, match.index + match[0].length]);
    if (match[0].length === 0) regex.lastIndex += 1;
  }

  for (const [start, end] of spans.reverse()) {
    work.text = `${work.text.slice(0, start)} ${work.text.slice(end)}`;
  }
}

function parseKilometres(work: Work): void {
  const KM = String.raw`(?:km|kms|kilomet(?:er|re)s?)`;

  consume(
    work,
    new RegExp(
      String.raw`(${MAX_WORDS}|${MIN_WORDS}|${AROUND_WORDS})?\s*${NUM}\s*(k|thousand)?\s*${KM}\b(?!\s*range)`,
      "i",
    ),
    (match) => {
      const value = kilometres(match[2] ?? "0", match[3]);
      const word = (match[1] ?? "").toLowerCase();
      if (new RegExp(`^${MIN_WORDS}$`, "i").test(word)) {
        work.filters.kmMin = value;
        work.found.push(`driven over ${value.toLocaleString("en-IN")} km`);
      } else if (new RegExp(`^${AROUND_WORDS}$`, "i").test(word)) {
        work.filters.kmMin = Math.round(value * 0.85);
        work.filters.kmMax = Math.round(value * 1.15);
        work.found.push(`around ${value.toLocaleString("en-IN")} km`);
      } else {
        work.filters.kmMax = value;
        work.found.push(`under ${value.toLocaleString("en-IN")} km`);
      }
    },
  );

  consume(
    work,
    new RegExp(
      String.raw`(?:driven|odometer|run|running)\s*(?:${MAX_WORDS}|${MIN_WORDS})?\s*${NUM}\s*(k|thousand)?\b`,
      "i",
    ),
    (match) => {
      const value = kilometres(match[1] ?? "0", match[2]);
      if (/\b(above|over|more than|greater than|at least)\b/i.test(match[0])) {
        work.filters.kmMin = value;
      } else {
        work.filters.kmMax = value;
      }
      work.found.push(`odometer ${value.toLocaleString("en-IN")} km`);
    },
  );

  consume(
    work,
    /\b(low|less|fewer|minimal|lightly|barely|hardly)\s*(?:km|kms|driven|run|used|running|kilomet\w+)\b/i,
    () => {
      work.filters.kmMax = Math.min(work.filters.kmMax ?? Infinity, 40_000);
      work.found.push("low kilometres");
    },
  );
}

function parseRange(work: Work): void {
  consume(
    work,
    new RegExp(
      String.raw`(?:range\s*(?:of|above|over|at least|more than|min(?:imum)?)?\s*${NUM}\s*(?:\+|plus)?\s*km|${NUM}\s*(?:\+|plus)?\s*km\s*(?:of\s*)?range)`,
      "i",
    ),
    (match) => {
      const value = toNumber(match[1] ?? match[2] ?? "0");
      if (value >= 50 && value <= 2_000) {
        work.filters.rangeMin = Math.round(value);
        work.filters.fuelTypes = ["ELECTRIC"];
        work.found.push(`at least ${value} km range`);
      }
    },
  );
}

function parseMileage(work: Work): void {
  consume(
    work,
    new RegExp(
      String.raw`(?:mileage|kmpl|km\/l|fuel economy|efficiency)\s*(?:of|above|over|at least|more than|min(?:imum)?|>)?\s*${NUM}\s*(?:kmpl|km\/l)?|${NUM}\s*(?:kmpl|km\/l)`,
      "i",
    ),
    (match) => {
      const value = toNumber(match[1] ?? match[2] ?? "0");
      if (value > 0 && value <= 60) {
        work.filters.mileageMin = value;
        work.found.push(`at least ${value} kmpl`);
      }
    },
  );

  consume(
    work,
    /\b(good|great|high|best|excellent)\s*(?:fuel\s*)?(?:mileage|economy|efficiency|average)\b|\bfuel[- ]?efficient\b/i,
    () => {
      work.filters.mileageMin = work.filters.mileageMin ?? 18;
      work.found.push("fuel efficient");
    },
  );
}

function parseYears(work: Work): void {
  const YEAR = String.raw`((?:19|20)\d\d)`;
  const currentYear = new Date().getFullYear();

  consume(
    work,
    new RegExp(String.raw`${YEAR}\s*(?:-|to|–)\s*${YEAR}`, "i"),
    (match) => {
      work.filters.yearMin = toNumber(match[1] ?? "0");
      work.filters.yearMax = toNumber(match[2] ?? "0");
      work.found.push(`${match[1]}-${match[2]} models`);
    },
  );

  consume(
    work,
    new RegExp(String.raw`(?:after|newer than|post|later than)\s*${YEAR}`, "i"),
    (match) => {
      work.filters.yearMin = toNumber(match[1] ?? "0") + 1;
      work.found.push(`after ${match[1]}`);
    },
  );

  consume(
    work,
    new RegExp(
      String.raw`(?:since|from|\bmin(?:imum)?\s*year)\s*${YEAR}|${YEAR}\s*(?:or newer|onwards|onward|and above|\+|or later)`,
      "i",
    ),
    (match) => {
      work.filters.yearMin = toNumber(match[1] ?? match[2] ?? "0");
      work.found.push(`${work.filters.yearMin} or newer`);
    },
  );

  consume(
    work,
    new RegExp(String.raw`(?:before|older than|pre|earlier than)\s*${YEAR}`, "i"),
    (match) => {
      work.filters.yearMax = toNumber(match[1] ?? "0") - 1;
      work.found.push(`before ${match[1]}`);
    },
  );

  consume(
    work,
    new RegExp(
      String.raw`\b${YEAR}\s*(?:model|make|reg(?:istered|istration)?)?\b`,
      "i",
    ),
    (match) => {
      const year = toNumber(match[1] ?? "0");
      if (year < 1990 || year > currentYear + 1) return;
      if (
        work.filters.yearMin === undefined &&
        work.filters.yearMax === undefined
      ) {
        work.filters.yearMin = year;
        work.filters.yearMax = year;
        work.found.push(`${year} model`);
      }
    },
  );

  consume(
    work,
    /\b(recent|latest|newer|new(?:ish)?|late model)\b(?!\s*(?:car|cars)?\s*first)/i,
    () => {
      if (work.sort?.field === "year") return;
      work.filters.yearMin = work.filters.yearMin ?? currentYear - 3;
      work.found.push("recent model");
    },
  );
}

function parsePrices(work: Work): void {
  const P = String.raw`${CURRENCY}${NUM}\s*${PRICE_UNIT}`;

  consume(
    work,
    new RegExp(String.raw`(?:between|from)\s*${P}\s*(?:and|to|-|–)\s*${P}\b`, "i"),
    (match) => {
      const low = money(match[1] ?? "0", match[2] || match[4]);
      const high = money(match[3] ?? "0", match[4]);
      work.filters.priceMin = Math.min(low, high);
      work.filters.priceMax = Math.max(low, high);
      work.found.push("price range");
    },
  );

  consume(
    work,
    new RegExp(String.raw`${P}\s*(?:-|to|–)\s*${P}\b`, "i"),
    (match) => {
      const low = money(match[1] ?? "0", match[2] || match[4]);
      const high = money(match[3] ?? "0", match[4]);
      if (low >= 50_000 && high >= 50_000) {
        work.filters.priceMin = Math.min(low, high);
        work.filters.priceMax = Math.max(low, high);
        work.found.push("price range");
      }
    },
  );

  consume(
    work,
    new RegExp(
      String.raw`(${MAX_WORDS}|${MIN_WORDS}|${AROUND_WORDS}|budget(?:\s*(?:of|is|:))?)\s*${P}(?:\s*(?:rupees|rs|inr|budget|price))?\b`,
      "i",
    ),
    (match) => {
      const word = (match[1] ?? "").toLowerCase();
      const value = money(match[2] ?? "0", match[3]);
      if (value < 50_000) return;

      if (new RegExp(`^${MIN_WORDS}$`, "i").test(word)) {
        work.filters.priceMin = value;
        work.found.push(`over ${value.toLocaleString("en-IN")}`);
      } else if (new RegExp(`^${AROUND_WORDS}$`, "i").test(word)) {
        work.filters.priceMin = Math.round(value * 0.85);
        work.filters.priceMax = Math.round(value * 1.15);
        work.found.push(`around ${value.toLocaleString("en-IN")}`);
      } else {
        work.filters.priceMax = value;
        work.found.push(`under ${value.toLocaleString("en-IN")}`);
      }
    },
  );

  consume(
    work,
    new RegExp(
      String.raw`${CURRENCY}${NUM}\s*(lakhs?|lacs?|lkh|l|crores?|cr)\b`,
      "i",
    ),
    (match) => {
      if (
        work.filters.priceMax !== undefined ||
        work.filters.priceMin !== undefined
      )
        return;
      const value = money(match[1] ?? "0", match[2]);
      if (value >= 50_000) {
        work.filters.priceMax = value;
        work.found.push(`budget ${value.toLocaleString("en-IN")}`);
      }
    },
  );
}

const FUEL_WORDS: Array<
  [RegExp, SearchFilters["fuelTypes"] extends (infer T)[] | undefined ? T : never]
> = [
  [/\bpetrol\b|\bgasoline\b/i, "PETROL"],
  [/\bdiesel\b/i, "DIESEL"],
  [/\bcng\b/i, "CNG"],
  [/\bev\b|\bevs\b|\belectric\b|\bbattery\b/i, "ELECTRIC"],
  [/\bhybrid\b/i, "HYBRID"],
];

const BODY_WORDS: Array<[RegExp, NonNullable<SearchFilters["bodyTypes"]>[number]]> =
  [
    [/\bsuvs?\b|\bcrossovers?\b|\bcompact suv\b/i, "SUV"],
    [/\bsedans?\b|\bsaloons?\b/i, "SEDAN"],
    [/\bhatch(?:back)?s?\b/i, "HATCHBACK"],
    [/\bmpvs?\b|\bmuvs?\b|\bminivans?\b|\bpeople mover\b|\bvans?\b/i, "MPV"],
    [/\bcoupes?\b|\bcoupés?\b/i, "COUPE"],
    [/\bpick-?ups?\b|\btrucks?\b/i, "PICKUP"],
  ];

function parseEnums(work: Work): void {
  const NEG = String.raw`(?:not|no|non|except|excluding|without|avoid|other than|anything but)[- ]?`;

  consume(
    work,
    new RegExp(String.raw`\b${NEG}(petrol|diesel|cng|electric|ev|hybrid)s?\b`, "i"),
    (match) => {
      const word = (match[1] ?? "").toLowerCase();
      const fuel =
        word === "ev"
          ? "ELECTRIC"
          : (word.toUpperCase() as NonNullable<
              SearchFilters["excludeFuelTypes"]
            >[number]);
      work.filters.excludeFuelTypes = [
        ...(work.filters.excludeFuelTypes ?? []),
        fuel,
      ];
      work.found.push(`not ${word}`);
    },
  );

  consume(
    work,
    new RegExp(
      String.raw`\b${NEG}(suv|sedan|hatchback|hatch|mpv|muv|coupe|pickup)s?\b`,
      "i",
    ),
    (match) => {
      const word = (match[1] ?? "").toLowerCase();
      const body =
        word === "hatch"
          ? "HATCHBACK"
          : word === "muv"
            ? "MPV"
            : (word.toUpperCase() as NonNullable<
                SearchFilters["excludeBodyTypes"]
              >[number]);
      work.filters.excludeBodyTypes = [
        ...(work.filters.excludeBodyTypes ?? []),
        body,
      ];
      work.found.push(`not ${word}`);
    },
  );

  consume(
    work,
    new RegExp(String.raw`\b${NEG}(automatic|auto|manual)\b`, "i"),
    (match) => {
      const word = (match[1] ?? "").toLowerCase();
      work.filters.transmissions = [word === "manual" ? "AUTOMATIC" : "MANUAL"];
      work.found.push(`not ${word}`);
    },
  );

  for (const [pattern, fuel] of FUEL_WORDS) {
    if (pattern.test(work.text)) {
      work.filters.fuelTypes = [
        ...new Set([...(work.filters.fuelTypes ?? []), fuel]),
      ];
      work.found.push(fuel.toLowerCase());
    }
  }

  if (
    /\b(automatic|auto|amt|cvt|dct|ivt|torque converter|automatics)\b/i.test(
      work.text,
    ) ||
    /\bAT\b/.test(work.text)
  ) {
    work.filters.transmissions = ["AUTOMATIC"];
    work.found.push("automatic");
  } else if (
    /\b(manual|manuals|stick shift)\b/i.test(work.text) ||
    /\bMT\b/.test(work.text)
  ) {
    work.filters.transmissions = ["MANUAL"];
    work.found.push("manual");
  }

  const bodies = BODY_WORDS.filter(([pattern]) => pattern.test(work.text)).map(
    ([, body]) => body,
  );
  if (bodies.length > 0) {
    work.filters.bodyTypes = [...new Set(bodies)];
    work.found.push(bodies.join("/").toLowerCase());
  }
}

function parseCounts(work: Work): void {
  consume(work, /\b(\d)\s*[- ]?(?:seater|seats?)\b/i, (match) => {
    const seats = toNumber(match[1] ?? "0");
    if (seats >= 2 && seats <= 10) {
      work.filters.seatsMin = seats;
      work.found.push(`${seats} seater`);
    }
  });

  consume(work, /\b(\d)\s*[- ]?stars?\b/i, (match) => {
    const stars = toNumber(match[1] ?? "0");
    if (stars >= 0 && stars <= 5) {
      work.filters.safetyRatingMin = stars;
      work.found.push(`${stars} star safety`);
    }
  });

  if (
    /\b(high|good|top|best|great|excellent|strong)\s*(?:safety|ncap)|\bsafe(?:st|ty)?\b|\bncap\b|\bwell[- ]rated\b/i.test(
      work.text,
    )
  ) {
    work.filters.safetyRatingMin = work.filters.safetyRatingMin ?? 4;
    work.found.push("high safety");
  }

  if (/\b(first|single|1st|one)[- ]?(?:owner|owned)\b/i.test(work.text)) {
    work.filters.ownerCountMax = 1;
    work.found.push("first owner");
  } else if (/\b(second|2nd|two)[- ]?owners?\b/i.test(work.text)) {
    work.filters.ownerCountMax = 2;
    work.found.push("up to two owners");
  }

  if (/\bfamil(?:y|ies)\b/i.test(work.text)) {
    work.filters.seatsMin = Math.max(work.filters.seatsMin ?? 0, 5);
    work.found.push("family car");
  }
}

function parseSort(work: Work): void {
  const rules: Array<[RegExp, SearchSort]> = [
    [
      /\b(cheapest|lowest[- ]priced?|least expensive|most affordable|budget[- ]friendly|low(?:est)? price|price low to high)\b|\b(cheap|affordable|budget|economical)\b/i,
      { field: "price", direction: "asc" },
    ],
    [
      /\b(most expensive|priciest|highest[- ]priced?|price high to low|top end|top-end)\b/i,
      { field: "price", direction: "desc" },
    ],
    [
      /\b(newest|latest model|most recent|new(?:est)? first)\b/i,
      { field: "year", direction: "desc" },
    ],
    [/\b(oldest)\b/i, { field: "year", direction: "asc" }],
    [
      /\b(lowest km|least driven|least km|lowest kms|fewest km|least used|lowest odometer)\b/i,
      { field: "kmDriven", direction: "asc" },
    ],
    [
      /\b(safest|highest safety|best safety|top safety)\b/i,
      { field: "safetyRating", direction: "desc" },
    ],
    [
      /\b(best mileage|highest mileage|most fuel[- ]efficient|best fuel economy|most efficient)\b/i,
      { field: "mileageKmpl", direction: "desc" },
    ],
  ];

  for (const [pattern, sort] of rules) {
    if (pattern.test(work.text)) {
      work.sort = sort;
      work.found.push(`${sort.field} ${sort.direction}`);
      return;
    }
  }
}

function parseNames(work: Work, vocabulary: Vocabulary): void {
  const NEG = String.raw`(?:not|no|non|except|excluding|without|avoid|other than|anything but|nahi)[- ]?`;
  const makeNames = [
    ...vocabulary.makes.map((make) => ({ text: make, make })),
    ...Object.entries(ALIASES)
      .filter(([, alias]) => !alias.model)
      .map(([key, alias]) => ({ text: key, make: alias.make })),
  ].sort((a, b) => b.text.length - a.text.length);

  for (const entry of makeNames) {
    const escaped = entry.text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, String.raw`[^a-z0-9]*`);
    consume(work, new RegExp(String.raw`\b${NEG}${escaped}\b`, "i"), () => {
      const make = canonicalMake(entry.make, vocabulary) ?? entry.make;
      work.filters.excludeMakes = [
        ...new Set([...(work.filters.excludeMakes ?? []), make]),
      ];
      work.found.push(`not ${make}`);
    });
  }

  const lowered = work.text.toLowerCase();

  const cities = vocabulary.cities.filter((city) =>
    new RegExp(`\\b${city.toLowerCase()}\\b`).test(lowered),
  );
  for (const alias of Object.keys(CITY_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`).test(lowered)) {
      const city = canonicalCity(alias, vocabulary);
      if (city) cities.push(city);
    }
  }
  if (cities.length > 0) {
    work.filters.cities = [...new Set(cities)];
    work.found.push(`in ${work.filters.cities.join("/")}`);
  }

  const colors = vocabulary.colors.filter((color) =>
    new RegExp(`\\b${color.toLowerCase()}\\b`).test(lowered),
  );
  for (const alias of Object.keys(COLOR_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`).test(lowered)) {
      const color = canonicalColor(alias, vocabulary);
      if (color) colors.push(color);
    }
  }
  if (colors.length > 0) {
    work.filters.colors = [...new Set(colors)];
    work.found.push(work.filters.colors.join("/"));
  }

  const makes = new Set<string>();
  const models = new Set<string>();

  const modelEntries = [
    ...vocabulary.models.map((entry) => ({
      text: entry.model,
      resolve: () => entry,
    })),
    ...ALIAS_ENTRIES.filter((entry) => entry.alias.model).map((entry) => ({
      text: entry.text,
      resolve: () => canonicalModel(entry.text, vocabulary),
    })),
  ].sort((a, b) => b.text.length - a.text.length);

  for (const entry of modelEntries) {
    if (entry.text.length < 3) continue;
    const resolved = entry.resolve();
    const pattern = AMBIGUOUS_MODELS.has(entry.text.toLowerCase())
      ? String.raw`\b${flexPattern(`${resolved?.make ?? ""} ${entry.text}`)}\b`
      : String.raw`\b${flexPattern(entry.text)}\b`;
    consume(work, new RegExp(pattern, "i"), () => {
      const resolved = entry.resolve();
      if (resolved) {
        models.add(resolved.model);
        makes.add(resolved.make);
      }
    });
  }

  const makeEntries = [
    ...vocabulary.makes.map((make) => ({ text: make, make })),
    ...ALIAS_ENTRIES.filter((entry) => !entry.alias.model).map((entry) => ({
      text: entry.text,
      make: entry.alias.make,
    })),
  ].sort((a, b) => b.text.length - a.text.length);

  for (const entry of makeEntries) {
    consume(
      work,
      new RegExp(String.raw`\b${flexPattern(entry.text)}\b`, "i"),
      () => {
        const make = canonicalMake(entry.make, vocabulary);
        if (make) makes.add(make);
      },
    );
  }

  if (models.size > 0) work.filters.models = [...models];
  if (makes.size > 0) work.filters.makes = [...makes];
  if (models.size > 0 || makes.size > 0) {
    work.found.push([...makes, ...models].join(" "));
  }
}

function parseFeatures(work: Work): void {
  const lowered = work.text.toLowerCase();
  const features = new Set<NonNullable<ReturnType<typeof canonicalFeature>>>();

  const probes = [
    "panoramic sunroof",
    "sunroof",
    "sun roof",
    "moonroof",
    "6 airbags",
    "six airbags",
    "adas",
    "360 camera",
    "rear camera",
    "reverse camera",
    "ventilated seats",
    "leather seats",
    "adaptive cruise",
    "cruise control",
    "wireless charging",
    "carplay",
    "android auto",
    "touchscreen",
    "isofix",
    "rear ac",
    "climate control",
    "keyless",
    "push button start",
    "led headlamps",
    "alloy wheels",
    "hill hold",
    "tpms",
    "fast charging",
    "connected car",
    "heads-up display",
    "head up display",
    "hud",
    "premium audio",
    "electric tailgate",
    "captain seats",
  ];

  for (const probe of probes.sort((a, b) => b.length - a.length)) {
    if (!lowered.includes(probe)) continue;
    const feature = canonicalFeature(probe);
    if (!feature) continue;
    consume(work, new RegExp(String.raw`\b${flexPattern(probe)}\b`, "i"), () => {
      features.add(feature);
    });
  }

  if (features.size > 0) {
    work.filters.features = [...features];
    work.found.push(`with ${[...features].join(", ")}`);
  }
}

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "in",
  "on",
  "at",
  "to",
  "for",
  "with",
  "me",
  "my",
  "i",
  "want",
  "need",
  "show",
  "find",
  "get",
  "give",
  "list",
  "looking",
  "search",
  "please",
  "car",
  "cars",
  "vehicle",
  "vehicles",
  "gaadi",
  "some",
  "any",
  "all",
  "under",
  "below",
  "above",
  "over",
  "between",
  "around",
  "about",
  "than",
  "less",
  "more",
  "than",
  "km",
  "kms",
  "lakh",
  "lakhs",
  "lac",
  "cr",
  "crore",
  "rs",
  "inr",
  "budget",
  "price",
  "priced",
  "within",
  "upto",
  "up",
  "max",
  "min",
  "only",
  "which",
  "that",
  "is",
  "are",
  "be",
  "have",
  "has",
  "one",
  "ones",
  "options",
  "suggest",
  "recommend",
  "good",
  "best",
  "nice",
  "top",
  "buy",
  "used",
  "second",
  "hand",
  "pre",
  "owned",
  "preowned",
  "first",
  "owner",
  "owners",
  "seater",
  "seaters",
  "seats",
  "star",
  "stars",
  "safety",
  "rating",
  "ratings",
  "rated",
  "high",
  "low",
  "model",
  "models",
  "make",
  "makes",
  "brand",
  "brands",
  "new",
  "old",
  "recent",
  "latest",
  "newer",
  "older",
  "driven",
  "run",
  "running",
  "odometer",
  "mileage",
  "range",
  "auto",
  "automatic",
  "manual",
  "petrol",
  "diesel",
  "cng",
  "electric",
  "ev",
  "hybrid",
  "suv",
  "suvs",
  "sedan",
  "sedans",
  "hatchback",
  "hatchbacks",
  "hatch",
  "mpv",
  "muv",
  "coupe",
  "pickup",
  "truck",
  "van",
  "cheapest",
  "cheap",
  "affordable",
  "newest",
  "oldest",
  "safest",
  "lowest",
  "highest",
  "most",
  "least",
  "ke",
  "andar",
  "wali",
  "waali",
  "hai",
  "ho",
  "chahiye",
  "please",
  "not",
  "no",
  "non",
  "except",
  "without",
  "but",
  "anything",
  "mein",
  "se",
  "kam",
  "zyada",
  "sasti",
  "sasta",
]);

function residualHasIntent(work: Work): boolean {
  const words = work.text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(
      (word) => word.length > 1 && !STOPWORDS.has(word) && !/^\d+$/.test(word),
    );
  return words.length > 0;
}

export function parseHeuristic(query: string, vocabulary: Vocabulary): ParsedQuery {
  const work: Work = { text: ` ${query} `, filters: {}, sort: null, found: [] };

  parseRange(work);
  parseMileage(work);
  parseKilometres(work);
  parseYears(work);
  parsePrices(work);
  parseSort(work);
  parseCounts(work);
  parseNames(work, vocabulary);
  parseFeatures(work);
  parseEnums(work);

  const residual = stripNames(work, vocabulary);
  const hasSemanticIntent = residualHasIntent({ ...work, text: residual });

  const notes =
    work.found.length > 0
      ? `Parsed without the model: ${work.found.join(", ")}.`
      : "Parsed without the model: no structured constraints recognised.";

  return normalizeParse(
    {
      isVehicleQuery: true,
      hasSemanticIntent,
      semanticQuery: query,
      filters: work.filters,
      sort: work.sort,
      notes,
    },
    query,
    vocabulary,
    "heuristic",
  );
}

function stripNames(work: Work, vocabulary: Vocabulary): string {
  let text = work.text.toLowerCase();
  const names = [
    ...(work.filters.makes ?? []),
    ...(work.filters.models ?? []),
    ...(work.filters.cities ?? []),
    ...(work.filters.colors ?? []),
    ...(work.filters.features ?? []),
    ...Object.keys(ALIASES),
    ...vocabulary.makes,
    ...vocabulary.models.map((entry) => entry.model),
    ...Object.keys(CITY_ALIASES),
    "sunroof",
    "sun roof",
    "airbags",
    "camera",
    "cruise",
    "carplay",
    "android",
    "seats",
  ];
  for (const name of names) {
    const escaped = name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`\\b${escaped}\\b`, "g"), " ");
  }
  return text;
}
