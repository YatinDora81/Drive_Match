export type Rng = {
  next: () => number;
  between: (min: number, max: number) => number;
  int: (min: number, max: number) => number;
  chance: (probability: number) => boolean;
  pick: <T>(items: readonly T[]) => T;
  weighted: <T>(items: readonly T[], weightOf: (item: T) => number) => T;
  shuffle: <T>(items: readonly T[]) => T[];
};

export function createRng(seed: number): Rng {
  const next = mulberry32(seed);

  const between = (min: number, max: number): number => min + (max - min) * next();

  const int = (min: number, max: number): number =>
    Math.min(max, Math.floor(between(min, max + 1)));

  const pick = <T>(items: readonly T[]): T => at(items, int(0, items.length - 1));

  const weighted = <T>(items: readonly T[], weightOf: (item: T) => number): T => {
    const total = items.reduce((sum, item) => sum + weightOf(item), 0);
    let roll = next() * total;

    for (const item of items) {
      roll -= weightOf(item);
      if (roll < 0) return item;
    }

    return at(items, items.length - 1);
  };

  const shuffle = <T>(items: readonly T[]): T[] => {
    const out = [...items];

    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i);
      const held = at(out, i);
      out[i] = at(out, j);
      out[j] = held;
    }

    return out;
  };

  return {
    next,
    between,
    int,
    chance: (probability) => next() < probability,
    pick,
    weighted,
    shuffle,
  };
}

export function uuidFrom(rng: Rng): string {
  const bytes = Array.from({ length: 16 }, () => rng.int(0, 255));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

export function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new Error(`No item at index ${index}`);
  return item;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
