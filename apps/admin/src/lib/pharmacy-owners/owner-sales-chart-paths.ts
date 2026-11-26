import type { SalesPeriodMonth } from '@e-pharmacy/types/primitives';

//===================================================================

// Owner chart uses the established year/month URL convention.
// A blank year represents the implicit current-year selection on legacy URLs.
export type SalesChartRouteState = Readonly<{
  year: string;
  month: SalesPeriodMonth;
}>;

export const DEFAULT_SALES_CHART_ROUTE: SalesChartRouteState = {
  year: '',
  month: 'all',
};

//===================================================================

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

//===================================================================

export function getSalesChartYear(state: SalesChartRouteState): string {
  return state.year || String(new Date().getFullYear());
}

//===================================================================

export function parseSalesChartSegments(
  segments: readonly string[]
): SalesChartRouteState {
  let year = '';
  let month: SalesPeriodMonth = 'all';

  const seen = new Set<string>();

  for (const segment of segments) {
    if (segment.startsWith('year-')) {
      if (seen.has('year')) throw new TypeError('Duplicate year filter');

      const rawYear = segment.slice('year-'.length);
      const n = Number(rawYear);

      if (!/^\d{4}$/.test(rawYear) || n < MIN_YEAR || n > MAX_YEAR)
        throw new TypeError('Invalid sales year');

      year = rawYear;
      seen.add('year');
    } else if (segment.startsWith('month-')) {
      if (seen.has('month')) throw new TypeError('Duplicate month filter');

      const rawMonth = segment.slice('month-'.length);
      const n = Number(rawMonth);

      if (!/^(?:0?[1-9]|1[0-2])$/.test(rawMonth) || n < 1 || n > 12)
        throw new TypeError('Invalid sales month');

      month = String(n) as SalesPeriodMonth;
      seen.add('month');
    } else {
      throw new TypeError('Unknown sales filter');
    }
  }

  return { year, month };
}

//===================================================================

export function buildSalesChartPath(
  base: string,
  state: SalesChartRouteState
): string {
  const segments: string[] = [];

  const year =
    state.year || (state.month !== 'all' ? getSalesChartYear(state) : '');

  if (year) {
    if (!/^\d{4}$/.test(year) || +year < MIN_YEAR || +year > MAX_YEAR)
      throw new TypeError('Invalid sales year');

    segments.push(`year-${year}`);
  }

  if (state.month !== 'all') {
    const m = Number(state.month);

    if (!Number.isInteger(m) || m < 1 || m > 12)
      throw new TypeError('Invalid sales month');

    segments.push(`month-${String(m).padStart(2, '0')}`);
  }

  return segments.length ? `${base}/${segments.join('/')}` : base;
}
