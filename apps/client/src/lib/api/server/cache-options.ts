import 'server-only';

import type { PublicBackendRequestOptions } from '@e-pharmacy/next-api/server';

import { PUBLIC_CACHE_REVALIDATE_SECONDS } from '../public-cache-policy';

//===================================================================

const PUBLIC_API_TIMEOUT_MS = 20_000;

//===================================================================

const PUBLIC_API_RETRY_OPTIONS = {
  attempts: 3,
  statuses: [408, 429, 502, 503, 504],
  delayMs: 500,
} as const;

//===================================================================

export const PUBLIC_COMMERCE_CACHE_OPTIONS = {
  next: { revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS.commerce },
  timeoutMs: PUBLIC_API_TIMEOUT_MS,
  retry: PUBLIC_API_RETRY_OPTIONS,
} satisfies Omit<PublicBackendRequestOptions, 'method' | 'body'>;

//===================================================================

export const PUBLIC_REVIEWS_CACHE_OPTIONS = {
  next: { revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS.reviews },
  timeoutMs: PUBLIC_API_TIMEOUT_MS,
  retry: PUBLIC_API_RETRY_OPTIONS,
} satisfies Omit<PublicBackendRequestOptions, 'method' | 'body'>;

//===================================================================

export const PUBLIC_DICTIONARY_CACHE_OPTIONS = {
  next: { revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS.dictionary },
  timeoutMs: PUBLIC_API_TIMEOUT_MS,
  retry: PUBLIC_API_RETRY_OPTIONS,
} satisfies Omit<PublicBackendRequestOptions, 'method' | 'body'>;
