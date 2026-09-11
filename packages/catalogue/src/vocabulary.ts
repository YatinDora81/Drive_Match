import { MODELS } from "./models.ts";

export type City = { name: string; state: string };

export type ModelAlias = { make: string; model?: string };

export const MAKES: readonly string[] = [
  ...new Set(MODELS.map((line) => line.make)),
];

export const CITIES = [
  { name: "Delhi", state: "DL" },
  { name: "Mumbai", state: "MH" },
  { name: "Pune", state: "MH" },
  { name: "Bengaluru", state: "KA" },
  { name: "Hyderabad", state: "TS" },
  { name: "Chennai", state: "TN" },
  { name: "Kolkata", state: "WB" },
  { name: "Ahmedabad", state: "GJ" },
  { name: "Jaipur", state: "RJ" },
  { name: "Lucknow", state: "UP" },
  { name: "Chandigarh", state: "CH" },
  { name: "Kochi", state: "KL" },
  { name: "Indore", state: "MP" },
  { name: "Gurugram", state: "HR" },
] as const satisfies readonly City[];

export type CityName = (typeof CITIES)[number]["name"];

export const COLORS = [
  "white",
  "silver",
  "grey",
  "black",
  "blue",
  "red",
  "brown",
  "beige",
  "orange",
  "green",
  "maroon",
  "yellow",
] as const;

export type Color = (typeof COLORS)[number];

const NICKNAMES: Record<string, ModelAlias> = {
  maruti: { make: "Maruti Suzuki" },
  suzuki: { make: "Maruti Suzuki" },
  merc: { make: "Mercedes-Benz" },
  mercedes: { make: "Mercedes-Benz" },
  benz: { make: "Mercedes-Benz" },
  vw: { make: "Volkswagen" },
  "tata motors": { make: "Tata" },
  "mg motor": { make: "MG" },
  "xuv 700": { make: "Mahindra", model: "XUV700" },
  "xuv 300": { make: "Mahindra", model: "XUV300" },
  scorpio: { make: "Mahindra", model: "Scorpio-N" },
  "scorpio n": { make: "Mahindra", model: "Scorpio-N" },
  innova: { make: "Toyota", model: "Innova Crysta" },
  crysta: { make: "Toyota", model: "Innova Crysta" },
  hyryder: { make: "Toyota", model: "Urban Cruiser Hyryder" },
  "urban cruiser": { make: "Toyota", model: "Urban Cruiser Hyryder" },
  wagonr: { make: "Maruti Suzuki", model: "Wagon R" },
  "wagon-r": { make: "Maruti Suzuki", model: "Wagon R" },
  alto: { make: "Maruti Suzuki", model: "Alto K10" },
  k10: { make: "Maruti Suzuki", model: "Alto K10" },
  "vitara brezza": { make: "Maruti Suzuki", model: "Brezza" },
  nexonev: { make: "Tata", model: "Nexon EV" },
  "nexon electric": { make: "Tata", model: "Nexon EV" },
  tigor: { make: "Tata", model: "Tigor EV" },
  "grand i10": { make: "Hyundai", model: "Grand i10 Nios" },
  nios: { make: "Hyundai", model: "Grand i10 Nios" },
  i10: { make: "Hyundai", model: "Grand i10 Nios" },
  ioniq: { make: "Hyundai", model: "Ioniq 5" },
  ioniq5: { make: "Hyundai", model: "Ioniq 5" },
  "honda city": { make: "Honda", model: "City" },
  "city zx": { make: "Honda", model: "City" },
  "city vx": { make: "Honda", model: "City" },
  "city hybrid": { make: "Honda", model: "City e:HEV" },
  "city ehev": { make: "Honda", model: "City e:HEV" },
  "eco sport": { make: "Ford", model: "EcoSport" },
  "c class": { make: "Mercedes-Benz", model: "C-Class" },
  cclass: { make: "Mercedes-Benz", model: "C-Class" },
  c200: { make: "Mercedes-Benz", model: "C-Class" },
  c220d: { make: "Mercedes-Benz", model: "C-Class" },
  "bmw 3": { make: "BMW", model: "3 Series" },
  "3-series": { make: "BMW", model: "3 Series" },
  "320d": { make: "BMW", model: "3 Series" },
  "330i": { make: "BMW", model: "3 Series" },
  "2 series": { make: "BMW", model: "2 Series Gran Coupe" },
  "gran coupe": { make: "BMW", model: "2 Series Gran Coupe" },
  "audi a4": { make: "Audi", model: "A4" },
  atto: { make: "BYD", model: "Atto 3" },
  atto3: { make: "BYD", model: "Atto 3" },
  "mg zs": { make: "MG", model: "ZS EV" },
  zsev: { make: "MG", model: "ZS EV" },
  dmax: { make: "Isuzu", model: "D-Max V-Cross" },
  "d-max": { make: "Isuzu", model: "D-Max V-Cross" },
  "d max": { make: "Isuzu", model: "D-Max V-Cross" },
  vcross: { make: "Isuzu", model: "D-Max V-Cross" },
  "v-cross": { make: "Isuzu", model: "D-Max V-Cross" },
};

const AMBIGUOUS_MODELS: ReadonlySet<string> = new Set(["city"]);

export const MODEL_ALIASES: Readonly<Record<string, ModelAlias>> = {
  ...Object.fromEntries(MAKES.map((make) => [make.toLowerCase(), { make }])),
  ...Object.fromEntries(
    MODELS.filter((line) => !AMBIGUOUS_MODELS.has(line.model.toLowerCase())).map(
      (line) => [line.model.toLowerCase(), { make: line.make, model: line.model }],
    ),
  ),
  ...NICKNAMES,
};
