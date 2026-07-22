import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BUSINESS_TIME_ZONE,
  DISPLAY_LOCALE,
  formatDateTime,
  formatShortDate,
  formatTableDateTimeParts,
  parseDateInput,
} from './date-formatters';

//===================================================================

test('uses an explicit English locale and Kyiv business timezone', () => {
  assert.equal(DISPLAY_LOCALE, 'en-GB');
  assert.equal(BUSINESS_TIME_ZONE, 'Europe/Kyiv');
  assert.equal(formatShortDate('2026-07-22'), '22 Jul 2026');
  assert.equal(
    formatDateTime('2026-07-21T22:30:00.000Z'),
    '22 July 2026 at 01:30'
  );
});

//===================================================================

test('returns null instead of throwing for invalid or empty dates', () => {
  assert.equal(parseDateInput(''), null);
  assert.equal(formatShortDate('not-a-date'), null);
  assert.equal(formatDateTime(Number.NaN), null);
  assert.equal(formatTableDateTimeParts(new Date('invalid')), null);
});

//===================================================================

test('returns reusable table date parts', () => {
  assert.deepEqual(formatTableDateTimeParts('2026-07-22T10:05:00.000Z'), {
    dayMonth: '22 Jul',
    year: '2026',
    time: '13:05',
  });
});
