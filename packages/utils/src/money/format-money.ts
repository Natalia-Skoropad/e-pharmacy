export const MONEY_LOCALE = 'en-GB';
export const MONEY_CURRENCY = 'UAH';

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
  const finiteValues = values
    .map(normalizeFiniteNumber)
    .filter((value): value is number => value !== null);

  if (finiteValues.length === 0) return null;

  return {
    min: Math.min(...finiteValues),
    max: Math.max(...finiteValues),
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
