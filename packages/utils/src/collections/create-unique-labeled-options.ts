export type LabeledOption<TValue extends string> = Readonly<{
  value: TValue;
  label: string;
}>;

//===================================================================

export function createUniqueLabeledOptions<TValue extends string>(
  values: readonly TValue[],
  getLabel: (value: TValue) => string,
  locale = 'en-GB'
): readonly LabeledOption<TValue>[] {
  return [...new Set(values)]
    .map((value) => ({ value, label: getLabel(value) }))
    .sort((first, second) => first.label.localeCompare(second.label, locale));
}
