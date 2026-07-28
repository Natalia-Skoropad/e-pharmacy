const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const ABSOLUTE_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i;
const TRAVERSAL_SEGMENT_PATTERN = /(?:^|\/)\.{1,2}(?:\/|$)/;

//===================================================================

export class InvalidApiPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidApiPathError';
  }
}

//===================================================================

export class InvalidApiBaseUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidApiBaseUrlError';
  }
}

//===================================================================

function assertRelativeApiPath(path: string): void {
  if (!path || CONTROL_CHARACTER_PATTERN.test(path)) {
    throw new InvalidApiPathError(
      'API path must be non-empty and must not contain control characters.'
    );
  }

  if (path.includes('#')) {
    throw new InvalidApiPathError('API paths must not contain fragments.');
  }

  if (path.startsWith('//') || ABSOLUTE_SCHEME_PATTERN.test(path)) {
    throw new InvalidApiPathError(
      'API requests require a relative path and an explicit baseUrl.'
    );
  }

  const pathWithoutQuery = path.split('?', 1)[0] ?? '';
  let decodedPath: string;

  try {
    decodedPath = decodeURIComponent(pathWithoutQuery);
  } catch {
    throw new InvalidApiPathError('API path contains invalid encoding.');
  }

  if (
    decodedPath.includes('\\') ||
    TRAVERSAL_SEGMENT_PATTERN.test(decodedPath)
  ) {
    throw new InvalidApiPathError(
      'API path contains a forbidden traversal segment.'
    );
  }
}

//===================================================================

function parseApiBaseUrl(baseUrl: string): URL {
  if (!baseUrl?.trim()) {
    throw new InvalidApiBaseUrlError('API base URL is not configured.');
  }

  let parsed: URL;

  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new InvalidApiBaseUrlError('API base URL is invalid.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new InvalidApiBaseUrlError('API base URL must use HTTP or HTTPS.');
  }

  if (parsed.username || parsed.password) {
    throw new InvalidApiBaseUrlError(
      'API base URL must not contain credentials.'
    );
  }

  if (parsed.search || parsed.hash) {
    throw new InvalidApiBaseUrlError(
      'API base URL must not contain query parameters or fragments.'
    );
  }

  return parsed;
}

//===================================================================

export function createApiUrl(path: string, baseUrl: string): string {
  assertRelativeApiPath(path);

  const parsedBaseUrl = parseApiBaseUrl(baseUrl);
  const basePath = parsedBaseUrl.pathname.endsWith('/')
    ? parsedBaseUrl.pathname
    : `${parsedBaseUrl.pathname}/`;

  parsedBaseUrl.pathname = basePath;
  const relativePath = path.startsWith('/') ? path.slice(1) : path;

  return new URL(relativePath, parsedBaseUrl).toString();
}
