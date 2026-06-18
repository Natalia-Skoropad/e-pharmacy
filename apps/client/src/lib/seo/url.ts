import { createAbsoluteUrl } from '@/lib/seo';
import { CLIENT_ENV } from '@/lib/constants/env';

//===================================================================

export function createClientAbsoluteUrl(path: string): string {
  return createAbsoluteUrl(path, CLIENT_ENV.siteUrl);
}
