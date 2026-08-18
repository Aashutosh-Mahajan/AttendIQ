/**
 * Fast Client-Side API Utility with In-Flight Request Deduplication & In-Memory Caching.
 * Eliminates waterfall delays and redundant duplicate network calls across components.
 */

type CacheEntry = {
  data: any;
  timestamp: number;
};

const cache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();

const DEFAULT_TTL_MS = 5000; // 5 seconds in-memory cache

export async function fetchJson<T = any>(
  url: string,
  options?: RequestInit & { ttl?: number; forceRefresh?: boolean }
): Promise<T> {
  const method = options?.method?.toUpperCase() || 'GET';

  // Only GET requests are cached/deduplicated
  if (method !== 'GET') {
    invalidateCache();
    const res = await fetch(url, options);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed with status ${res.status}`);
    }
    return res.json();
  }

  const ttl = options?.ttl ?? DEFAULT_TTL_MS;
  const now = Date.now();

  // 1. Check in-memory cache if not forcing refresh
  if (!options?.forceRefresh) {
    const cached = cache.get(url);
    if (cached && now - cached.timestamp < ttl) {
      return cached.data as T;
    }
  }

  // 2. Check if identical request is currently in-flight
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url) as Promise<T>;
  }

  // 3. Dispatch fresh request
  const requestPromise = (async () => {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      cache.set(url, { data, timestamp: Date.now() });
      return data as T;
    } finally {
      inFlightRequests.delete(url);
    }
  })();

  inFlightRequests.set(url, requestPromise);
  return requestPromise;
}

/**
 * Invalidate cache entries matching a URL prefix or pattern.
 * If no pattern is provided, clears all cache.
 */
export function invalidateCache(pattern?: string) {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}
