type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

export class CatalogCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(ttlMs = 10 * 60_000, maxEntries = 100) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  get(key: string) {
    const entry = this.entries.get(key);

    if (!entry) return null;

    if (Date.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return null;
    }

    this.entries.delete(key);
    this.entries.set(key, entry);

    return entry.value;
  }

  set(key: string, value: T) {
    this.entries.delete(key);
    this.entries.set(key, { expiresAt: Date.now() + this.ttlMs, value });

    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;

      if (oldestKey === undefined) break;
      this.entries.delete(oldestKey);
    }
  }
}
