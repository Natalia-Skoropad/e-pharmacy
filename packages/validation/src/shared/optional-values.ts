export function normalizeOptionalText(value: string): string | undefined {
  const normalizedValue = value.trim();
  return normalizedValue || undefined;
}
