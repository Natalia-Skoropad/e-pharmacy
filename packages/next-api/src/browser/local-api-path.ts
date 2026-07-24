const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const ABSOLUTE_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i;

//===================================================================

export function assertLocalApiPath(path: string): void {
  if (!path || CONTROL_CHARACTER_PATTERN.test(path)) {
    throw new TypeError('Local API path must be a non-empty safe path.');
  }

  if (
    ABSOLUTE_SCHEME_PATTERN.test(path) ||
    path.startsWith('//') ||
    !path.startsWith('/api/')
  ) {
    throw new TypeError(
      'localApiRequest only accepts same-origin paths under /api/.'
    );
  }

  const url = new URL(path, 'http://next-api.internal');

  if (url.origin !== 'http://next-api.internal' || !url.pathname.startsWith('/api/')) {
    throw new TypeError(
      'localApiRequest only accepts same-origin paths under /api/.'
    );
  }
}
