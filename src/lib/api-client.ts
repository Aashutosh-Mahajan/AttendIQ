/**
 * Ultra-Fast Client-Side API Utility with In-Flight Request Deduplication,
 * In-Memory Caching, Stale-While-Revalidate (SWR), and Prefetching.
 * Eliminates network waterfalls and redundant roundtrips across components.
 */

type CacheEntry<T = any> = {
  data: T;
  timestamp: number;
};

const cache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();

const DEFAULT_TTL_MS = 10000; // 10 seconds fresh cache

export interface FetchOptions extends RequestInit {
  ttl?: number;
  forceRefresh?: boolean;
  /** If true and cached data exists (even if stale), return it immediately while fetching fresh data in the background */
  swr?: boolean;
}

export async function fetchJson<T = any>(
  url: string,
  options?: FetchOptions
): Promise<T> {
  const method = options?.method?.toUpperCase() || 'GET';

  // Non-GET requests bypass and invalidate cache
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
  const cached = cache.get(url);

  // 1. Return fresh cached data immediately
  if (!options?.forceRefresh && cached) {
    const isFresh = now - cached.timestamp < ttl;
    if (isFresh) {
      return cached.data as T;
    }

    // If SWR requested, return stale data immediately and revalidate in background
    if (options?.swr) {
      revalidateInBackground<T>(url, options);
      return cached.data as T;
    }
  }

  // 2. Check if identical request is currently in-flight
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url) as Promise<T>;
  }

  // 3. Dispatch fresh request with deduplication
  const requestPromise = executeFetch<T>(url, options);
  inFlightRequests.set(url, requestPromise);
  return requestPromise;
}

async function executeFetch<T>(url: string, options?: FetchOptions): Promise<T> {
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
}

function revalidateInBackground<T>(url: string, options?: FetchOptions) {
  if (inFlightRequests.has(url)) return;
  const promise = executeFetch<T>(url, options).catch((err) => {
    console.debug(`[api-client] SWR revalidation failed for ${url}`, err);
  });
  inFlightRequests.set(url, promise);
}

/**
 * Prefetch an API endpoint in the background to warm the cache.
 */
export function prefetchJson(url: string, options?: FetchOptions) {
  if (typeof window === 'undefined') return;
  const cached = cache.get(url);
  const ttl = options?.ttl ?? DEFAULT_TTL_MS;
  if (cached && Date.now() - cached.timestamp < ttl) return;
  if (inFlightRequests.has(url)) return;

  const promise = executeFetch(url, options).catch(() => {});
  inFlightRequests.set(url, promise);
}

/**
 * Directly update or seed the in-memory cache for a URL.
 */
export function mutateCache<T>(url: string, data: T) {
  cache.set(url, { data, timestamp: Date.now() });
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
