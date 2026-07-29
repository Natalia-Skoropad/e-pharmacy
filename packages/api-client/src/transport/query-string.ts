export type QueryPrimitive = string | number | boolean;

//===================================================================

export type QueryValue =
  | QueryPrimitive
  | readonly QueryPrimitive[]
  | null
  | undefined;

export type QueryParams = Readonly<Record<string, QueryValue>>;

//===================================================================

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

//===================================================================

export class InvalidQueryParameterError extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidQueryParameterError';
  }
}

//===================================================================

function assertPath(path: string): void {
  if (!path || CONTROL_CHARACTER_PATTERN.test(path)) {
    throw new InvalidQueryParameterError(
      'Query parameters require a non-empty path without control characters.'
    );
  }

  if (path.includes('#')) {
    throw new InvalidQueryParameterError(
      'API paths with query parameters must not contain fragments.'
    );
  }
}

//===================================================================

function serializeQueryValue(
  key: string,
  value: QueryPrimitive
): string | null {
  if (typeof value === 'string') return value === '' ? null : value;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new InvalidQueryParameterError(
        `Query parameter "${key}" must be a finite number.`
      );
    }

    return String(value);
  }

  if (typeof value === 'boolean') return String(value);

  throw new InvalidQueryParameterError(
    `Query parameter "${key}" has an unsupported value.`
  );
}

//===================================================================

export function appendQueryParams(path: string, params: QueryParams): string {
  assertPath(path);

  const queryIndex = path.indexOf('?');
  const pathname = queryIndex === -1 ? path : path.slice(0, queryIndex);
  const existingQuery = queryIndex === -1 ? '' : path.slice(queryIndex + 1);
  const searchParams = new URLSearchParams(existingQuery);

  for (const [key, rawValue] of Object.entries(params)) {
    if (!key || CONTROL_CHARACTER_PATTERN.test(key)) {
      throw new InvalidQueryParameterError(
        'Query parameter names must be non-empty and must not contain control characters.'
      );
    }

    if (rawValue === undefined || rawValue === null || rawValue === '') {
      continue;
    }

    if (Array.isArray(rawValue)) {
      searchParams.delete(key);

      for (const item of rawValue) {
        const serialized = serializeQueryValue(key, item);
        if (serialized !== null) searchParams.append(key, serialized);
      }

      continue;
    }

    const serialized = serializeQueryValue(key, rawValue as QueryPrimitive);
    if (serialized !== null) searchParams.set(key, serialized);
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
