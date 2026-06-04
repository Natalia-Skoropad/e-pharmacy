import { CLIENT_ENV } from '@/lib/constants/env';

//===================================================================

export function createAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return new URL(normalizedPath, CLIENT_ENV.siteUrl).toString();
}
