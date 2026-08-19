import { assertTrustedBackendPath } from './trusted-backend-path';

//===================================================================

const INTERNAL_ORIGIN = 'http://next-api.internal';

export const MAX_PROXY_QUERY_LENGTH = 4_096;
export const MAX_PROXY_QUERY_PARAMETER_COUNT = 50;
export const MAX_PROXY_URL_LENGTH = 8_192;

//===================================================================

export class ProxyQueryError extends Error {
  readonly status: 400 | 414;
  readonly code: 'INVALID_QUERY' | 'QUERY_TOO_LARGE';

  constructor(
    message: string,
    options: Readonly<{
      status: 400 | 414;
      code: 'INVALID_QUERY' | 'QUERY_TOO_LARGE';
    }>
  ) {
    super(message);
    this.name = 'ProxyQueryError';
    this.status = options.status;
    this.code = options.code;
  }
}

//===================================================================

function assertPracticalUrlLength(path: string, search: string): void {
  const separatorLength =
    search && search !== '?' && !search.startsWith('?') ? 1 : 0;
  const combinedLength = path.length + separatorLength + search.length;

  if (combinedLength > MAX_PROXY_URL_LENGTH) {
    throw new ProxyQueryError('The request URL is too long.', {
      status: 414,
      code: 'QUERY_TOO_LARGE',
    });
  }
}

//===================================================================

function assertPracticalQueryLimits(search: string): void {
  const rawQuery = search.startsWith('?') ? search.slice(1) : search;

  if (rawQuery.length > MAX_PROXY_QUERY_LENGTH) {
    throw new ProxyQueryError('The query string is too long.', {
      status: 414,
      code: 'QUERY_TOO_LARGE',
    });
  }

  const incoming = new URLSearchParams(rawQuery);
  let parameterCount = 0;

  for (const _entry of incoming) {
    parameterCount += 1;

    if (parameterCount > MAX_PROXY_QUERY_PARAMETER_COUNT) {
      throw new ProxyQueryError('The query contains too many parameters.', {
        status: 400,
        code: 'INVALID_QUERY',
      });
    }
  }
}

//===================================================================

export function appendSearchParams(path: string, search: string): string {
  assertTrustedBackendPath(path);
  assertPracticalUrlLength(path, search);

  if (!search || search === '?') return path;

  assertPracticalQueryLimits(search);

  const url = new URL(path, INTERNAL_ORIGIN);
  const incoming = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search
  );

  incoming.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  return `${url.pathname}${url.search}`;
}
