import { ThinkingLevel, type Schema, Type } from "@google/genai";
import { env } from "@repo/config";
import {
  BODY_TYPES,
  FEATURES,
  FUEL_TYPES,
  SORT_FIELDS,
  TRANSMISSIONS,
} from "@repo/contracts";
import { callGemini } from "../gemini/key-ring.ts";
import type { RawParse } from "./normalize.ts";
import type { Vocabulary } from "./vocabulary.ts";

export const PROMPT_VERSION = 3;

const nullableNumber: Schema = { type: Type.NUMBER, nullable: true };
const enumList = (values: readonly string[]): Schema => ({
  type: Type.ARRAY,
  items: { type: Type.STRING, enum: [...values] },
});
const stringList: Schema = { type: Type.ARRAY, items: { type: Type.STRING } };

export const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    isVehicleQuery: { type: Type.BOOLEAN },
    hasSemanticIntent: { type: Type.BOOLEAN },
    semanticQuery: { type: Type.STRING },
    filters: {
      type: Type.OBJECT,
      properties: {
        bodyTypes: enumList(BODY_TYPES),
        fuelTypes: enumList(FUEL_TYPES),
        transmissions: enumList(TRANSMISSIONS),
        makes: stringList,
        models: stringList,
        cities: stringList,
        colors: stringList,
        features: enumList(FEATURES),
        excludeBodyTypes: enumList(BODY_TYPES),
        excludeFuelTypes: enumList(FUEL_TYPES),
        excludeMakes: stringList,
        priceMin: nullableNumber,
        priceMax: nullableNumber,
        kmMin: nullableNumber,
        kmMax: nullableNumber,
        yearMin: nullableNumber,
        yearMax: nullableNumber,
        seatsMin: nullableNumber,
        seatsMax: nullableNumber,
        safetyRatingMin: nullableNumber,
        ownerCountMax: nullableNumber,
        mileageMin: nullableNumber,
        rangeMin: nullableNumber,
      },
      required: [
        "bodyTypes",
        "fuelTypes",
        "transmissions",
        "makes",
        "models",
        "cities",
        "colors",
        "features",
        "excludeBodyTypes",
        "excludeFuelTypes",
        "excludeMakes",
        "priceMin",
        "priceMax",
        "kmMin",
        "kmMax",
        "yearMin",
        "yearMax",
        "seatsMin",
        "seatsMax",
        "safetyRatingMin",
        "ownerCountMax",
        "mileageMin",
        "rangeMin",
      ],
    },
    sort: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        field: {
          type: Type.STRING,
          enum: SORT_FIELDS.filter((field) => field !== "relevance"),
        },
        direction: { type: Type.STRING, enum: ["asc", "desc"] },
      },
      required: ["field", "direction"],
    },
    notes: { type: Type.STRING },
  },
  required: [
    "isVehicleQuery",
    "hasSemanticIntent",
    "semanticQuery",
    "filters",
    "sort",
    "notes",
  ],
};

function systemPrompt(vocabulary: Vocabulary, today: string): string {
  const models = vocabulary.models
    .map((entry) => `${entry.make} ${entry.model}`)
    .join("; ");

  return `You turn a shopper's natural language request into structured filters for a used-car catalogue in India.
Today is ${today}. Prices are in Indian rupees. Output only the JSON described by the schema.

UNITS AND CONVENTIONS
- "L", "lakh", "lac" = 100,000 rupees. "Cr", "crore" = 10,000,000 rupees. "k" with km = thousand kilometres, "k" with a price = thousand rupees.
  "15L" and "15 lakh" and "under 15" (in a price context) all mean 1,500,000. "1.2 Cr" = 12,000,000. Never drop or add zeros.
- "under/below/less than/within/max/upto" -> Max. "above/over/more than/at least/min" -> Min. "around/about/approx X" -> Min 0.85X and Max 1.15X.
  "between X and Y" -> both. A bare budget ("15 lakh budget", "₹8L") is a Max.
- Distances with km/kms/driven/odometer are kmDriven. "low km", "less driven", "lightly used" -> kmMax 40000. "80k km" = 80000.
- "range" with an EV means rangeMin (km) and fuelTypes ["ELECTRIC"]. "mileage"/"kmpl"/"fuel efficient"/"good mileage" means fuel economy -> mileageMin (18 if unspecified).
- Years: "2020 model" -> yearMin 2020 yearMax 2020; "after 2020" -> yearMin 2021; "2019 or newer"/"since 2019" -> yearMin 2019; "before 2018" -> yearMax 2017; "recent/new/latest" -> yearMin ${Number(today.slice(0, 4)) - 3}.
- Transmission: automatic/AT/AMT/CVT/DCT/iMT/torque converter -> AUTOMATIC; manual/MT -> MANUAL.
- Fuel: EV/electric/battery -> ELECTRIC; hybrid -> HYBRID; CNG -> CNG.
- Body: SUV/crossover -> SUV; MPV/MUV/people mover/van -> MPV; hatch -> HATCHBACK; saloon -> SEDAN; pickup/truck -> PICKUP.
- Negations ("not diesel", "no Maruti", "anything but a hatchback", "except SUVs") go into excludeFuelTypes / excludeMakes / excludeBodyTypes, never into the positive lists.
- "7 seater" -> seatsMin 7. "family"/"family car" -> seatsMin 5 (and describe it in semanticQuery). "high safety"/"safe"/"safest"/"good NCAP" -> safetyRatingMin 4; "5 star" -> 5.
- "first owner"/"single owner" -> ownerCountMax 1. "second owner" -> 2.
- Superlatives set sort and no bound: cheapest/lowest price/most affordable/budget/cheap -> price asc; most expensive -> price desc; newest/latest -> year desc; lowest km/least driven -> kmDriven asc; safest -> safetyRating desc; best mileage/most fuel efficient -> mileageKmpl desc.
- "luxury"/"premium" is semantic unless a brand is named; do not invent a price bound for it.
- Only use a make, model or city from the vocabulary below; if the shopper names one that is not there, leave it out of the filters and keep the words in semanticQuery.
- Features must be chosen from the feature list. They are preferences, so list every feature the shopper mentions.

SEMANTIC QUERY
semanticQuery is the full request rewritten as a rich description of the ideal car, including the constraint words AND expanded soft intent
("family" -> "spacious, safe, comfortable family car with a big boot"; "fun" -> "peppy, engaging to drive"). It is embedded for similarity ranking.
hasSemanticIntent is false only when every word of the request became a filter or a sort and nothing soft remains ("automatic Creta in Delhi",
"diesel cars under 10 lakh"). It is true for words like family, reliable, fun, premium, city commute, first car, long drives, safe, spacious.

isVehicleQuery is false only when the text is clearly not about finding a car (weather, code, chit chat). notes is one short sentence, in plain
English, saying how you read the request, mentioning any assumption ("took 'under 15' as ₹15 lakh").

VOCABULARY
Body types: ${BODY_TYPES.join(", ")}. Fuel types: ${FUEL_TYPES.join(", ")}. Transmissions: ${TRANSMISSIONS.join(", ")}.
Makes: ${vocabulary.makes.join(", ") || "(catalogue not loaded)"}.
Models: ${models || "(catalogue not loaded)"}.
Cities: ${vocabulary.cities.join(", ") || "(catalogue not loaded)"}.
Colours: ${vocabulary.colors.join(", ") || "(catalogue not loaded)"}.
Features: ${FEATURES.join(", ")}.`;
}

export type LlmParse = {
  raw: RawParse;
  model: string;
  usage: { promptTokens?: number; completionTokens?: number };
};

export async function parseWithGemini(
  query: string,
  vocabulary: Vocabulary,
  opts: {
    today: string;
    model: string;
    waitForCooldown?: boolean;
    deadlineMs?: number;
  },
): Promise<LlmParse> {
  const response = await callGemini(
    `understanding the query (${opts.model})`,
    (client) =>
      client.models.generateContent({
        model: opts.model,
        contents: `Request: ${query}`,
        config: {
          systemInstruction: systemPrompt(vocabulary, opts.today),
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          temperature: 0,
        },
      }),
    { waitForCooldown: opts.waitForCooldown ?? false, deadlineMs: opts.deadlineMs },
  );

  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty parse");

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned malformed json: ${text.slice(0, 200)}`);
  }

  if (typeof raw !== "object" || raw === null) {
    throw new Error("Gemini returned an unexpected shape");
  }

  return {
    raw: raw as RawParse,
    model: opts.model,
    usage: {
      promptTokens: response.usageMetadata?.promptTokenCount,
      completionTokens: response.usageMetadata?.candidatesTokenCount,
    },
  };
}
