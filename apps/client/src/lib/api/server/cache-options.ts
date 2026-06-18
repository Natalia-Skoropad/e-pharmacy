import type { RequestOptions } from '@e-pharmacy/api-client/core';

//===================================================================

export const PUBLIC_API_REVALIDATE_SECONDS = 300;

export const PUBLIC_API_CACHE_OPTIONS = {
  cache: 'force-cache',
  next: { revalidate: PUBLIC_API_REVALIDATE_SECONDS },
} satisfies RequestOptions;
