import type { CalendarDateString } from '../primitives';

//===================================================================

/** Shared list filters for admin-managed reference data. */
export type ReferenceDataListQueryParams = Readonly<{
  page?: number;
  perPage?: number;
  keyword?: string;
  createdFrom?: CalendarDateString;
  createdTo?: CalendarDateString;
}>;
