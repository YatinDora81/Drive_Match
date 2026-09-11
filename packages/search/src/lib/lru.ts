type Entry<V> = { value: V; expiresAt: number };

export class LruCache<V> {
  private readonly map = new Map<string, Entry<V>>();

  constructor(
    private readonly capacity: number,
    private readonly ttlMs: number,
  ) {}

  get(key: string): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      this.map.delete(key);
      return undefined;
    }

    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    if (this.ttlMs <= 0) return;

    this.map.delete(key);
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });

    while (this.map.size > this.capacity) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }

  get size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}
