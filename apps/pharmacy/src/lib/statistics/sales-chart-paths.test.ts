import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSalesChartPath,
  getSalesChartYear,
  parseSalesChartSegments,
} from './sales-chart-paths';

//===================================================================

const pharmacyId = '6ac75e170642845c5d27fd6c';
const productId = '6ac75e1417684f6f914a4d59';

//===================================================================

test('pharmacy and client sales period URLs round-trip in canonical year/month order', () => {
  const segments = ['month-6', 'year-2026'];
  const parsed = parseSalesChartSegments(segments);

  assert.equal(parsed.year, '2026');
  assert.equal(parsed.month, '6');
  assert.equal(parsed.pharmacyId, '');

  assert.equal(
    buildSalesChartPath(`/pharmacy/pharmacies/${pharmacyId}`, parsed),
    `/pharmacy/pharmacies/${pharmacyId}/year-2026/month-06`
  );

  assert.equal(
    buildSalesChartPath(`/pharmacy/clients/${pharmacyId}/details`, parsed),
    `/pharmacy/clients/${pharmacyId}/details/year-2026/month-06`
  );
});

//===================================================================

test('product filters combine pharmacy and period without losing either filter', () => {
  const base = `/pharmacy/products/${productId}/statistics`;

  const parsed = parseSalesChartSegments(
    ['year-2026', `pharmacy-id-${pharmacyId}`, 'month-11'],
    { allowPharmacy: true }
  );

  assert.equal(
    buildSalesChartPath(base, parsed, { allowPharmacy: true }),
    `${base}/pharmacy-id-${pharmacyId}/year-2026/month-11`
  );

  assert.equal(
    buildSalesChartPath(
      base,
      { ...parsed, month: 'all' },
      { allowPharmacy: true }
    ),
    `${base}/pharmacy-id-${pharmacyId}/year-2026`
  );

  assert.equal(
    buildSalesChartPath(
      base,
      { ...parsed, year: '', month: 'all' },
      { allowPharmacy: true }
    ),
    `${base}/pharmacy-id-${pharmacyId}`
  );

  assert.equal(
    buildSalesChartPath(
      base,
      { ...parsed, pharmacyId: '' },
      { allowPharmacy: true }
    ),
    `${base}/year-2026/month-11`
  );
});

//===================================================================

test('legacy pages keep their base URLs until a filter is chosen', () => {
  const initial = parseSalesChartSegments([]);

  assert.equal(getSalesChartYear(initial), String(new Date().getFullYear()));

  assert.equal(
    buildSalesChartPath(`/pharmacy/pharmacies/${pharmacyId}`, initial),
    `/pharmacy/pharmacies/${pharmacyId}`
  );
});

//===================================================================

test('invalid, unexpected or duplicate filters are rejected', () => {
  for (const bad of [
    ['year-abc'],
    ['year-2026', 'year-2025'],
    ['month-00'],
    ['month-13'],
    ['month-06', 'month-07'],
    ['unrelated-filter'],
    [`pharmacy-id-${pharmacyId}`],
  ]) {
    assert.throws(() => parseSalesChartSegments(bad));
  }

  assert.throws(() =>
    parseSalesChartSegments(['pharmacy-id-not-an-id'], { allowPharmacy: true })
  );
});
