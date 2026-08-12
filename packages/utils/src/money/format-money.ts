export const MONEY_LOCALE = 'en-GB';
export const MONEY_CURRENCY = '₴';

//===================================================================

const AMOUNT_FORMATTER = new Intl.NumberFormat(MONEY_LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

//===================================================================

export type NumericRange = Readonly<{
  min: number;
  max: number;
}>;

//===================================================================

function normalizeFiniteNumber(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  return Object.is(value, -0) ? 0 : value;
}

//===================================================================

export function formatAmount(value: number): string | null {
  const normalizedValue = normalizeFiniteNumber(value);
  return normalizedValue === null
    ? null
    : AMOUNT_FORMATTER.format(normalizedValue);
}

//===================================================================

export function formatMoney(value: number): string | null {
  const amount = formatAmount(value);
  return amount === null ? null : `${amount} ${MONEY_CURRENCY}`;
}

//===================================================================

export function getNumericRange(
  values: readonly number[]
): NumericRange | null {
  if (values.length === 0) return null;

  const numbers: number[] = [];

  for (const value of values) {
    const normalizedValue = normalizeFiniteNumber(value);
    if (normalizedValue === null) return null;
    numbers.push(normalizedValue);
  }

  return {
    min: Math.min(...numbers),
    max: Math.max(...numbers),
  };
}

//===================================================================

export function formatMoneyRange(range: NumericRange): string | null {
  if (range.min > range.max) return null;

  const min = formatMoney(range.min);
  const max = formatMoney(range.max);

  if (min === null || max === null) return null;
  return range.min === range.max ? min : `${min} – ${max}`;
}
