import { z } from 'zod';

//===================================================================

export function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const normalizedValue = value.trim();
  return normalizedValue === '' ? undefined : normalizedValue;
}

//===================================================================

export function optionalTrimmedTextSchema({
  maxLength,
  maxMessage,
  pattern,
  patternMessage,
}: Readonly<{
  maxLength: number;
  maxMessage: string;
  pattern?: RegExp;
  patternMessage?: string;
}>) {
  let schema = z.string().trim().max(maxLength, maxMessage);

  if (pattern && patternMessage) {
    schema = schema.regex(pattern, patternMessage);
  }

  return z.preprocess(emptyStringToUndefined, schema.optional());
}

//===================================================================

export function optionalSchema<TSchema extends z.ZodType>(schema: TSchema) {
  return z.preprocess(emptyStringToUndefined, schema.optional());
}
