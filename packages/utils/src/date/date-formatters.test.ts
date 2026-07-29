import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BUSINESS_TIME_ZONE,
  DISPLAY_LOCALE,
  formatCalendarDate,
  formatDateTime,
  formatShortDate,
  formatTableDateTimeParts,
  parseCalendarDate,
  parseInstantDate,
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

test('keeps calendar dates independent from instant timezones', () => {
  assert.equal(formatCalendarDate('2026-07-22'), '22 Jul 2026');
  assert.equal(formatCalendarDate('2024-02-29'), '29 Feb 2024');
  assert.equal(parseCalendarDate('2026-02-29'), null);
  assert.equal(formatCalendarDate('2026-99-45'), null);
});

//===================================================================

test('rejects environment-dependent offset-less date-times', () => {
  assert.equal(parseInstantDate('2026-07-22'), null);
  assert.equal(parseInstantDate('2026-07-22T10:05:00'), null);
  assert.equal(formatDateTime('2026-07-22T10:05:00'), null);
  assert.notEqual(parseInstantDate('2026-07-22T10:05:00+03:00'), null);
  assert.equal(formatDateTime('2026-07-22'), null);
});

//===================================================================

test('returns null instead of throwing for invalid or empty dates', () => {
  assert.equal(parseInstantDate(''), null);
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
