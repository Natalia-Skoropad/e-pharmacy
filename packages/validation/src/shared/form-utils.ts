export type FormErrors<TValues extends object> = Partial<
  Record<keyof TValues, string>
>;

export type FormTouchedFields<TValues extends object> = Partial<
  Record<keyof TValues, boolean>
>;

//===================================================================

export function hasValidationErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}

//===================================================================

export function isValidationResultValid(errors: object): boolean {
  return !hasValidationErrors(errors);
}

//===================================================================

export function markAllFieldsTouched<TField extends string>(
  fields: readonly TField[]
): Partial<Record<TField, boolean>> {
  return fields.reduce<Partial<Record<TField, boolean>>>((acc, field) => {
    acc[field] = true;
    return acc;
  }, {});
}
