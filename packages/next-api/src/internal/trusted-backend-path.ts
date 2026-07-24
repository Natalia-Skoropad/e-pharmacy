const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const ABSOLUTE_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i;
const TRAVERSAL_SEGMENT_PATTERN = /(?:^|\/)\.{1,2}(?:\/|$)/;

//===================================================================

export class InvalidBackendPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBackendPathError';
  }
}

//===================================================================

export function assertTrustedBackendPath(path: string): void {
  if (!path || CONTROL_CHARACTER_PATTERN.test(path)) {
    throw new InvalidBackendPathError(
      'Backend path must be a non-empty path without control characters.'
    );
  }

  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new InvalidBackendPathError(
      'Backend path must start with exactly one forward slash.'
    );
  }

  if (ABSOLUTE_SCHEME_PATTERN.test(path)) {
    throw new InvalidBackendPathError('Absolute backend URLs are forbidden.');
  }

  const pathWithoutQuery = path.split(/[?#]/, 1)[0] ?? '';
  let decodedPath: string;

  try {
    decodedPath = decodeURIComponent(pathWithoutQuery);
  } catch {
    throw new InvalidBackendPathError(
      'Backend path contains invalid encoding.'
    );
  }

  if (
    decodedPath.includes('\\') ||
    TRAVERSAL_SEGMENT_PATTERN.test(decodedPath)
  ) {
    throw new InvalidBackendPathError(
      'Backend path contains a forbidden traversal segment.'
    );
  }
}
