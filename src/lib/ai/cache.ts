/**
 * Simple in-memory LRU cache for AI suggestions.
 * Best-effort caching in Vercel serverless (cache resets on cold starts).
 * Prevents duplicate API calls for the same OKR title + category within 1 hour.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const MAX_ENTRIES = 200;
const TTL_MS = 60 * 60 * 1000; // 1 hour

const cache = new Map<string, CacheEntry<unknown>>();

function evictOldest(): void {
  if (cache.size <= MAX_ENTRIES) return;

  // Find oldest entry
  let oldestKey = "";
  let oldestTime = Infinity;

  for (const [key, entry] of cache) {
    if (entry.timestamp < oldestTime) {
      oldestTime = entry.timestamp;
      oldestKey = key;
    }
  }

  if (oldestKey) cache.delete(oldestKey);
}

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  // Check TTL
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
  evictOldest();
}

export function buildCacheKey(
  title: string,
  category: string,
  existingKrs?: string[]
): string {
  const normalized = `${title.toLowerCase().trim()}:${category}`;
  if (existingKrs && existingKrs.length > 0) {
    return `${normalized}:${existingKrs.sort().join(",")}`;
  }
  return normalized;
}
