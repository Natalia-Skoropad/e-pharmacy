import type {
  PharmacySearchOptionsParams,
  PharmacySearchOptionsResponse,
} from '@e-pharmacy/types/pharmacies';

//===================================================================

// A small, short-lived LRU for *public* search results only. Keys include
// the complete server-side filter context, page and page size; a previous
// search must never contaminate the options shown for a different filter.
export const PHARMACY_SELECT_PAGE_SIZE = 50;
const CACHE_TTL_MS = 2 * 60 * 1000;
const CACHE_MAX_PAGES = 80;

//===================================================================

type CacheEntry = Readonly<{
  response: PharmacySearchOptionsResponse;
  expiresAt: number;
}>;

//===================================================================

function cacheKey(params: PharmacySearchOptionsParams): string {
  const normalize = (value?: string) =>
    (value ?? '').trim().toLocaleLowerCase();

  return JSON.stringify([
    params.kind,
    normalize(params.query),
    normalize(params.settlement),
    normalize(params.region),
    params.pharmacyId ?? '',
    params.selectedId ?? '',
    params.page ?? 1,
    params.perPage ?? PHARMACY_SELECT_PAGE_SIZE,
  ]);
}

//===================================================================

export function createPharmacyOptionsPageCache(
  ttlMs = CACHE_TTL_MS,
  maxPages = CACHE_MAX_PAGES
) {
  const pages = new Map<string, CacheEntry>();

  return {
    get(params: PharmacySearchOptionsParams, now = Date.now()) {
      const key = cacheKey(params);
      const entry = pages.get(key);

      if (!entry) return null;

      if (entry.expiresAt <= now) {
        pages.delete(key);
        return null;
      }

      // Refresh recency, not expiry: frequent reads must not keep stale
      // public data alive indefinitely.
      pages.delete(key);
      pages.set(key, entry);

      return entry.response;
    },

    set(
      params: PharmacySearchOptionsParams,
      response: PharmacySearchOptionsResponse,
      now = Date.now()
    ) {
      const key = cacheKey(params);

      pages.delete(key);
      pages.set(key, { response, expiresAt: now + ttlMs });

      while (pages.size > maxPages) {
        const oldestKey = pages.keys().next().value;

        if (oldestKey === undefined) break;

        pages.delete(oldestKey);
      }
    },
  };
}

export const pharmacyOptionsPageCache = createPharmacyOptionsPageCache();
