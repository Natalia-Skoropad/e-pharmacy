import { SITE_URL } from '@/lib/constants/metadata';

export function createAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return new URL(normalizedPath, SITE_URL).toString();
}
