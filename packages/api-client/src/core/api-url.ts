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

function assertRelativeApiPath(path: string): void {
  if (!path || CONTROL_CHARACTER_PATTERN.test(path)) {
    throw new InvalidApiPathError(
      'API path must be non-empty and must not contain control characters.'
    );
  }

  if (path.startsWith('//') || ABSOLUTE_SCHEME_PATTERN.test(path)) {
    throw new InvalidApiPathError(
      'API requests require a relative path and an explicit baseUrl.'
    );
  }

  const pathWithoutQuery = path.split(/[?#]/, 1)[0] ?? '';
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

export function createApiUrl(path: string, baseUrl: string): string {
  assertRelativeApiPath(path);

  if (!baseUrl?.trim()) {
    throw new Error('API base URL is not configured. Pass baseUrl explicitly.');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, baseUrl).toString();
}
