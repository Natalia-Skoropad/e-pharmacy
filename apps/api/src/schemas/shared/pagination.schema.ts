import { z } from 'zod';

//===================================================================

type PaginationQueryRecord = Record<string, unknown>;

//===================================================================

function isPaginationQueryRecord(
  value: unknown
): value is PaginationQueryRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

//===================================================================

export function normalizePaginationQuery(value: unknown): unknown {
  if (!isPaginationQueryRecord(value)) return value;

  const query = { ...value };
  if (query.perPage === undefined && query.limit !== undefined) {
    query.perPage = query.limit;
  }

  return query;
}

//===================================================================

export const positivePageSchema = z.coerce.number().int().min(1).default(1);

//===================================================================

export function createPerPageSchema({
  defaultValue,
  max,
}: Readonly<{ defaultValue: number; max: number }>) {
  return z.coerce.number().int().min(1).max(max).default(defaultValue);
}
