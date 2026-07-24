const SENSITIVE_QUERY_KEYS = new Set([
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'password',
  'email',
  'secret',
  'code',
  'resettoken',
  'reset_token',
]);

//===================================================================

export function redactRequestPath(path: string): string {
  try {
    const url = new URL(path, 'http://next-api.internal');

    url.searchParams.forEach((_value, key) => {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        url.searchParams.set(key, '[REDACTED]');
      }
    });

    return `${url.pathname}${url.search}`;
  } catch {
    return '[INVALID_PATH]';
  }
}
