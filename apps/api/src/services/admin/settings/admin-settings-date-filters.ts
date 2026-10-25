import type { AdminSettingsDictionaryListQuery } from '../../../schemas/admin/settings/admin-settings.schema';

//===============================================================

function startOfUtcDay(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

//===============================================================

function endOfUtcDay(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}

//===============================================================

export function buildCreatedAtFilter(
  query: AdminSettingsDictionaryListQuery
): Record<string, unknown> | undefined {
  if (!query.createdFrom && !query.createdTo) return undefined;

  return {
    ...(query.createdFrom ? { $gte: startOfUtcDay(query.createdFrom) } : {}),
    ...(query.createdTo ? { $lte: endOfUtcDay(query.createdTo) } : {}),
  };
}
