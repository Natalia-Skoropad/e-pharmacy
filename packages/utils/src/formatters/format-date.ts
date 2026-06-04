type DateFormatterOptions = {
  locale?: string;
  options: Intl.DateTimeFormatOptions;
};

//===================================================================

function formatDateValue(
  value: string,
  { locale = 'en-GB', options }: DateFormatterOptions
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(value));
}

//===================================================================

export function formatShortDate(value: string): string {
  return formatDateValue(value, {
    locale: 'en-GB',
    options: {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  });
}

//===================================================================

export function formatOrderDateTime(value: string): string {
  return formatDateValue(value, {
    locale: 'en-GB',
    options: {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  });
}

//===================================================================

export function formatReviewDate(value: string): string {
  return formatDateValue(value, {
    locale: 'uk-UA',
    options: {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  });
}
