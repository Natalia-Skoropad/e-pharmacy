import 'server-only';

import type { PublicBackendRequestOptions } from '@e-pharmacy/next-api/server';

//===================================================================

const PUBLIC_API_REVALIDATE_SECONDS = 3_600;
const PUBLIC_API_TIMEOUT_MS = 20_000;

//===================================================================

export const PUBLIC_API_CACHE_OPTIONS = {
  next: {
    revalidate: PUBLIC_API_REVALIDATE_SECONDS,
  },

  timeoutMs: PUBLIC_API_TIMEOUT_MS,

  retry: {
    attempts: 3,
    statuses: [408, 429, 502, 503, 504],
    delayMs: 500,
  },
} satisfies Omit<PublicBackendRequestOptions, 'method' | 'body'>;
