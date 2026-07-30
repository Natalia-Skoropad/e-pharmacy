import 'server-only';

import { getClientSiteUrl } from '@/lib/constants/env';

import { createAbsoluteUrl } from './sitemap';

//===================================================================

export function createClientAbsoluteUrl(path: string): string {
  return createAbsoluteUrl(path, getClientSiteUrl());
}
