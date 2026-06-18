import type { RequestOptions } from '@e-pharmacy/api-client/core';

//===================================================================

export const PUBLIC_API_REVALIDATE_SECONDS = 300;
export const PUBLIC_API_TIMEOUT_MS = 15_000;

//===================================================================

export const PUBLIC_API_CACHE_OPTIONS = {
  cache: 'force-cache',
  next: { revalidate: PUBLIC_API_REVALIDATE_SECONDS },
  timeoutMs: PUBLIC_API_TIMEOUT_MS,
  retry: {
    attempts: 2,
    statuses: [502, 503, 504],
    delayMs: 250,
  },
} satisfies RequestOptions;
