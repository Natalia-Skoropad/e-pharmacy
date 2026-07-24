declare const isoDateTimeStringBrand: unique symbol;
declare const calendarDateStringBrand: unique symbol;

//===================================================================

/** UTC timestamp such as 2026-07-24T08:30:00.000Z. */
export type ISODateTimeString = string & {
  readonly [isoDateTimeStringBrand]: 'ISODateTimeString';
};

//===================================================================

/** Calendar-only date such as 2026-07-24. */
export type CalendarDateString = string & {
  readonly [calendarDateStringBrand]: 'CalendarDateString';
};
