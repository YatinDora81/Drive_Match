const KEY = "drivematch.recents";
const MAX = 8;

const canStore = () => typeof window !== "undefined" && "localStorage" in window;

export function readRecents(): string[] {
  if (!canStore()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter((item): item is string => typeof item === "string")
          .slice(0, MAX)
      : [];
  } catch {
    return [];
  }
}

function write(list: string[]): void {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    return;
  }
}

export function pushRecent(query: string): string[] {
  const clean = query.trim();
  if (!clean) return readRecents();
  const lower = clean.toLowerCase();
  const next = [
    clean,
    ...readRecents().filter((item) => item.toLowerCase() !== lower),
  ].slice(0, MAX);
  write(next);
  return next;
}

export function clearRecents(): string[] {
  if (!canStore()) return [];
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    return [];
  }
  return [];
}
