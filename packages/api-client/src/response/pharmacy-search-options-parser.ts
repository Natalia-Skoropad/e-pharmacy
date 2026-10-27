import type { PharmacySearchOptionsResponse } from '@e-pharmacy/types/pharmacies';

import {
  parsePharmacyFilterOptionsResponse,
  parsePharmacyOptionsResponse,
} from './shared-dto-parsers';

//===================================================================

export function parsePharmacySearchOptionsResponse(
  value: unknown
): PharmacySearchOptionsResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Invalid pharmacy search options response');
  }

  const data = value as Record<string, unknown>;

  if (data.kind !== 'pharmacy' && data.kind !== 'location') {
    throw new TypeError('Invalid pharmacy search options kind');
  }

  for (const key of ['page', 'perPage', 'total', 'totalPages']) {
    const numericValue = data[key];

    if (
      typeof numericValue !== 'number' ||
      !Number.isSafeInteger(numericValue) ||
      numericValue < 0
    ) {
      throw new TypeError(`Invalid pharmacy search options ${key}`);
    }
  }

  const meta = {
    page: data.page as number,
    perPage: data.perPage as number,
    total: data.total as number,
    totalPages: data.totalPages as number,
  };

  if (data.kind === 'pharmacy') {
    return {
      kind: 'pharmacy',
      items: parsePharmacyOptionsResponse({ items: data.items }).items,
      ...meta,
    };
  }

  return {
    kind: 'location',

    items: parsePharmacyFilterOptionsResponse({
      locations: data.items,
      sort: [],
    }).locations,

    ...meta,
  };
}
