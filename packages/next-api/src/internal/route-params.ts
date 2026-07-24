import type { EntityId } from '@e-pharmacy/types/primitives';

//===================================================================

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export class InvalidRouteParameterError extends Error {
  constructor(
    readonly parameterName: string,
    message: string
  ) {
    super(message);
    this.name = 'InvalidRouteParameterError';
  }
}

//===================================================================

function decodeRouteSegment(value: string, parameterName: string): string {
  let decoded: string;

  try {
    decoded = decodeURIComponent(value);
  } catch {
    throw new InvalidRouteParameterError(
      parameterName,
      `${parameterName} contains invalid URL encoding.`
    );
  }

  if (
    !decoded ||
    decoded === '.' ||
    decoded === '..' ||
    decoded.includes('/') ||
    decoded.includes('\\') ||
    CONTROL_CHARACTER_PATTERN.test(decoded)
  ) {
    throw new InvalidRouteParameterError(
      parameterName,
      `${parameterName} contains a forbidden route segment.`
    );
  }

  return decoded;
}

//===================================================================

export function parseEntityIdSegment(
  value: string,
  parameterName = 'id'
): EntityId {
  const decoded = decodeRouteSegment(value, parameterName);

  if (!OBJECT_ID_PATTERN.test(decoded)) {
    throw new InvalidRouteParameterError(
      parameterName,
      `${parameterName} must be a valid entity identifier.`
    );
  }

  return decoded as EntityId;
}

//===================================================================

export function parseEnumRouteSegment<const TValue extends string>(
  value: string,
  allowedValues: readonly TValue[],
  parameterName: string
): TValue {
  const decoded = decodeRouteSegment(value, parameterName);

  if (!allowedValues.includes(decoded as TValue)) {
    throw new InvalidRouteParameterError(
      parameterName,
      `${parameterName} has an unsupported value.`
    );
  }

  return decoded as TValue;
}
