import type { RequestOptions } from '@e-pharmacy/api-client/core';

//===================================================================

export const PUBLIC_API_REVALIDATE_SECONDS = 120;
export const PUBLIC_API_TIMEOUT_MS = 6_000;

//===================================================================

export const PUBLIC_API_CACHE_OPTIONS = {
  cache: 'no-store',
  timeoutMs: PUBLIC_API_TIMEOUT_MS,
  retry: {
    attempts: 2,
    statuses: [502, 503, 504],
    delayMs: 150,
  },
} satisfies RequestOptions;
