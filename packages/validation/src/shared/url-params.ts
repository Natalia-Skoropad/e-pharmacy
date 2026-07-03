import { USER_SEARCH_MAX_LENGTH } from './limits';

//===================================================================

export const URL_TEXT_PARAM_DISALLOWED_CHARS_PATTERN = /[^A-Za-z0-9 .-]/g;
export const URL_ARTICLE_PARAM_DISALLOWED_CHARS_PATTERN = /[^A-Za-z0-9.-]/g;
export const URL_CLIENT_TEXT_PARAM_DISALLOWED_CHARS_PATTERN =
  /[^A-Za-z0-9 .@_+-]/g;

export const SLUG_SEGMENT_SEPARATOR_PATTERN = /[^a-z0-9]+/g;
export const CLIENT_SLUG_SEGMENT_SEPARATOR_PATTERN = /[^a-z0-9.@_+]+/g;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

//===================================================================

type SanitizeParamOptions = Readonly<{
  disallowedCharsPattern?: RegExp;
  maxLength?: number;
}>;

type SlugifySegmentOptions = Readonly<{
  separatorPattern?: RegExp;
  maxLength?: number;
}>;

//===================================================================

export function sanitizeTextParam(
  value?: string,
  {
    disallowedCharsPattern = URL_TEXT_PARAM_DISALLOWED_CHARS_PATTERN,
    maxLength = USER_SEARCH_MAX_LENGTH,
  }: SanitizeParamOptions = {}
): string {
  return (
    value?.trim().replace(disallowedCharsPattern, '').slice(0, maxLength) ?? ''
  );
}

//===================================================================

export function sanitizeArticleParam(value?: string): string {
  return sanitizeTextParam(value, {
    disallowedCharsPattern: URL_ARTICLE_PARAM_DISALLOWED_CHARS_PATTERN,
  });
}

//===================================================================

export function slugifySegment(
  value: string,
  {
    separatorPattern = SLUG_SEGMENT_SEPARATOR_PATTERN,
    maxLength = USER_SEARCH_MAX_LENGTH,
  }: SlugifySegmentOptions = {}
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(separatorPattern, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);
}

//===================================================================

export function deslugifyNameSegment(
  value: string,
  options?: SanitizeParamOptions
): string {
  return sanitizeTextParam(value.replace(/-/g, ' '), options);
}

//===================================================================

export function deslugifyArticleSegment(value: string): string {
  return sanitizeArticleParam(value);
}

//===================================================================

export function normalizeSlugEnumValue<TValue extends string>(
  value: string,
  allowedValues: readonly TValue[]
): TValue | null {
  const normalized = value.replace(/-/g, '_') as TValue;

  return allowedValues.includes(normalized) ? normalized : null;
}

//===================================================================

export function isDateParam(value?: string): boolean {
  return Boolean(value && DATE_PATTERN.test(value));
}

//===================================================================

export function slugifyStatus<TStatus extends string>(status: TStatus): string {
  return status.replace(/_/g, '-');
}
