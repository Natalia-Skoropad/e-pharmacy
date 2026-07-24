import { assertTrustedBackendPath } from './trusted-backend-path';

//===================================================================

const INTERNAL_ORIGIN = 'http://next-api.internal';

//===================================================================

export function appendSearchParams(path: string, search: string): string {
  assertTrustedBackendPath(path);

  if (!search || search === '?') return path;

  const url = new URL(path, INTERNAL_ORIGIN);
  const incoming = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  incoming.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  return `${url.pathname}${url.search}`;
}
