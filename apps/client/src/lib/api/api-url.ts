import { CLIENT_ENV } from '@/lib/constants/env';

//===================================================================

export function createApiUrl(path: string, baseUrl = CLIENT_ENV.apiBaseUrl): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return new URL(normalizedPath, baseUrl).toString();
}
