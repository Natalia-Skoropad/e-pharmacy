import 'server-only';

import { getClientCanonicalSiteUrl } from '@/lib/constants/env';

import { createAbsoluteUrl } from './sitemap';

//===================================================================

export function createClientAbsoluteUrl(path: string): string {
  return createAbsoluteUrl(path, getClientCanonicalSiteUrl());
}
