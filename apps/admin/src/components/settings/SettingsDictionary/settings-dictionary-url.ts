import type { RowsPerPageValue } from '@e-pharmacy/ui/forms';
import { isCalendarDateString } from '@e-pharmacy/validation/dates';

import {
  EMPTY_SETTINGS_DICTIONARY_FILTERS,
  type SettingsDictionaryFiltersValue,
} from './SettingsDictionaryFilters';

//===================================================================

export function slugForDictionaryItem(
  item: { name: string; slug?: string },
  isCategory: boolean
): string {
  if (isCategory && item.slug) return item.slug.replaceAll('_', '-');

  return item.name
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

//===================================================================

export type SettingsDictionaryUrlState = Readonly<{
  selectedSlug: string;
  filters: SettingsDictionaryFiltersValue;
  page: number;
  perPage: RowsPerPageValue;
}>;

//===================================================================

export function parseSettingsDictionarySegments(
  segments: readonly string[],
  selectionPrefix: 'position' | 'category'
): SettingsDictionaryUrlState {
  let selectedSlug = '';
  let page = 1;
  let perPage: RowsPerPageValue = 20;
  let createdFrom: SettingsDictionaryFiltersValue['createdFrom'] = '';
  let createdTo: SettingsDictionaryFiltersValue['createdTo'] = '';

  for (const segment of segments) {
    if (segment.startsWith(`${selectionPrefix}-`))
      selectedSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        segment.slice(selectionPrefix.length + 1)
      )
        ? segment.slice(selectionPrefix.length + 1)
        : '';
    else if (/^page-[1-9]\d*$/.test(segment))
      page = Math.min(100000, Number(segment.slice(5)));
    else if (segment === 'per-page-50') perPage = 50;
    else if (segment === 'per-page-100') perPage = 100;
    else if (
      segment.startsWith('created-from-') &&
      isCalendarDateString(segment.slice(13))
    )
      createdFrom = segment.slice(13) as typeof createdFrom;
    else if (
      segment.startsWith('created-to-') &&
      isCalendarDateString(segment.slice(11))
    )
      createdTo = segment.slice(11) as typeof createdTo;
  }

  return {
    selectedSlug,
    page,
    perPage,

    filters:
      createdFrom && createdTo && createdFrom > createdTo
        ? EMPTY_SETTINGS_DICTIONARY_FILTERS
        : { createdFrom, createdTo },
  };
}

//===================================================================

export function buildSettingsDictionaryUrl(
  basePath: string,
  value: SettingsDictionaryUrlState
): string {
  const segments: string[] = [];
  const prefix = basePath.endsWith('categories') ? 'category' : 'position';

  if (value.selectedSlug) segments.push(`${prefix}-${value.selectedSlug}`);

  if (value.filters.createdFrom)
    segments.push(`created-from-${value.filters.createdFrom}`);

  if (value.filters.createdTo)
    segments.push(`created-to-${value.filters.createdTo}`);
  if (value.page > 1) segments.push(`page-${value.page}`);
  if (value.perPage !== 20) segments.push(`per-page-${value.perPage}`);

  return [basePath, ...segments].join('/');
}
