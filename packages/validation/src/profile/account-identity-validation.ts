import {
  buildEmailError,
  buildUserNameError,
  isValidationResultValid,
  normalizeEmail,
  type FormErrors,
  type FormTouchedFields,
} from '../shared';

//===================================================================

export type AccountIdentityFormValues = Readonly<{
  name: string;
  email: string;
}>;

export type AccountIdentityFormErrors = FormErrors<AccountIdentityFormValues>;
export type AccountIdentityTouchedFields =
  FormTouchedFields<AccountIdentityFormValues>;

//===================================================================

export const ACCOUNT_IDENTITY_FORM_FIELDS: Array<
  keyof AccountIdentityFormValues
> = ['name', 'email'];

//===================================================================

export function normalizeAccountIdentityValues(
  values: AccountIdentityFormValues
): AccountIdentityFormValues {
  return {
    name: values.name.trim(),
    email: normalizeEmail(values.email),
  };
}

//===================================================================

export function validateAccountIdentityForm(
  values: AccountIdentityFormValues
): AccountIdentityFormErrors {
  const errors: AccountIdentityFormErrors = {};
  const nameError = buildUserNameError(values.name, { required: true });
  const emailError = buildEmailError(values.email);

  if (nameError) errors.name = nameError;
  if (emailError) errors.email = emailError;

  return errors;
}

//===================================================================

export function isAccountIdentityFormValid(
  values: AccountIdentityFormValues
): boolean {
  return isValidationResultValid(validateAccountIdentityForm(values));
}

//===================================================================

export function isAccountIdentityFormDirty(
  values: AccountIdentityFormValues,
  initialValues: AccountIdentityFormValues
): boolean {
  const normalized = normalizeAccountIdentityValues(values);
  const initial = normalizeAccountIdentityValues(initialValues);

  return normalized.name !== initial.name || normalized.email !== initial.email;
}
