import 'server-only';

import type { PublicBackendRequestOptions } from '@e-pharmacy/next-api/server';

//===================================================================

export const PUBLIC_API_REVALIDATE_SECONDS = 120;
const PUBLIC_API_TIMEOUT_MS = 6_000;

//===================================================================

export const PUBLIC_API_CACHE_OPTIONS = {
  next: {
    revalidate: PUBLIC_API_REVALIDATE_SECONDS,
  },

  timeoutMs: PUBLIC_API_TIMEOUT_MS,

  retry: {
    attempts: 2,
    statuses: [502, 503, 504],
    delayMs: 150,
  },
} satisfies Omit<PublicBackendRequestOptions, 'method' | 'body'>;
