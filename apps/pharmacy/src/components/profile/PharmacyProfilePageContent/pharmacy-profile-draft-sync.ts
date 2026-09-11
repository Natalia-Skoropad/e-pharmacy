export type CanonicalDraftSync<T> = Readonly<{
  value: T;
  baseline: T;
}>;

//===================================================================

export function resolveCanonicalDraftSync<T>({
  canonicalValue,
  isDirty,
}: Readonly<{
  canonicalValue: T;
  isDirty: boolean;
}>): CanonicalDraftSync<T> | null {
  if (isDirty) return null;

  return {
    value: canonicalValue,
    baseline: canonicalValue,
  };
}
