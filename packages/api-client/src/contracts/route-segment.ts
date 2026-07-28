const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const PATH_SEPARATOR_PATTERN = /[\\/]/;

//===================================================================

export class InvalidRouteSegmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRouteSegmentError';
  }
}

//===================================================================

export function encodeRouteSegment(value: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new InvalidRouteSegmentError('Route segment must be non-empty.');
  }

  if (value === '.' || value === '..') {
    throw new InvalidRouteSegmentError('Dot route segments are not allowed.');
  }

  if (CONTROL_CHARACTER_PATTERN.test(value)) {
    throw new InvalidRouteSegmentError(
      'Route segment must not contain control characters.'
    );
  }

  if (PATH_SEPARATOR_PATTERN.test(value)) {
    throw new InvalidRouteSegmentError(
      'Route segment must not contain path separators.'
    );
  }

  if (value.includes('%')) {
    throw new InvalidRouteSegmentError(
      'Route segment must be provided in decoded form.'
    );
  }

  return encodeURIComponent(value);
}
