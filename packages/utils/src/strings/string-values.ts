export function capitalizeFirst(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

//===================================================================

export function getTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}
