import 'server-only';

import {
  PUBLIC_BACKEND_READ_TRANSPORT_OPTIONS,
  type PublicBackendRequestOptions,
} from '@e-pharmacy/next-api/server';

import { PUBLIC_CACHE_REVALIDATE_SECONDS } from '../public-cache-policy';

//===================================================================

export const PUBLIC_COMMERCE_CACHE_OPTIONS = {
  ...PUBLIC_BACKEND_READ_TRANSPORT_OPTIONS,
  next: { revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS.commerce },
} satisfies Omit<PublicBackendRequestOptions, 'method' | 'body'>;

//===================================================================

export const PUBLIC_REVIEWS_CACHE_OPTIONS = {
  ...PUBLIC_BACKEND_READ_TRANSPORT_OPTIONS,
  next: { revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS.reviews },
} satisfies Omit<PublicBackendRequestOptions, 'method' | 'body'>;

//===================================================================

export const PUBLIC_DICTIONARY_CACHE_OPTIONS = {
  ...PUBLIC_BACKEND_READ_TRANSPORT_OPTIONS,
  next: { revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS.dictionary },
} satisfies Omit<PublicBackendRequestOptions, 'method' | 'body'>;
