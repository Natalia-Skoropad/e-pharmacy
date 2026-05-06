import { ROUTES } from '@/lib/constants/routes';

//===================================================================

export function buildLoginRedirectPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${ROUTES.LOGIN}?redirect=${encodeURIComponent(normalizedPath)}`;
}
