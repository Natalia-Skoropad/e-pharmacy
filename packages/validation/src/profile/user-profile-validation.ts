import {
  buildAddressError,
  buildPasswordError,
  buildPhoneError,
  buildRequiredPasswordError,
  buildUserNameError,
  isValidationResultValid,
  normalizePhoneInput,
  VALIDATION_MESSAGES,
  USER_ADDRESS_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  type FormErrors,
  type FormTouchedFields,
} from '../shared';

//===================================================================

export type DataProfileFormValues = {
  name: string;
  phone: string;
  address: string;
};

export type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
};

//===================================================================

export type DataProfileFormErrors = FormErrors<DataProfileFormValues>;
export type ChangePasswordFormErrors = FormErrors<ChangePasswordFormValues>;
export type DataProfileTouchedFields = FormTouchedFields<DataProfileFormValues>;

export type ChangePasswordTouchedFields =
  FormTouchedFields<ChangePasswordFormValues>;

//===================================================================

export const DATA_PROFILE_INITIAL_VALUES: DataProfileFormValues = {
  name: '',
  phone: '',
  address: '',
};

export const CHANGE_PASSWORD_INITIAL_VALUES: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
};

//===================================================================

export const DATA_PROFILE_FORM_FIELDS: Array<keyof DataProfileFormValues> = [
  'name',
  'phone',
  'address',
];

export const CHANGE_PASSWORD_FORM_FIELDS: Array<
  keyof ChangePasswordFormValues
> = ['currentPassword', 'newPassword'];

//===================================================================

export function normalizeDataProfileValue(value: string): string {
  return value.trim();
}

//===================================================================

export function normalizeDataProfileValues(
  values: DataProfileFormValues
): DataProfileFormValues {
  return {
    name: normalizeDataProfileValue(values.name),
    phone: normalizePhoneInput(values.phone),
    address: normalizeDataProfileValue(values.address),
  };
}

//===================================================================

export function isDataProfileFormDirty(
  values: DataProfileFormValues,
  initialValues: DataProfileFormValues
): boolean {
  return DATA_PROFILE_FORM_FIELDS.some(
    (field) =>
      normalizeDataProfileValue(values[field]) !==
      normalizeDataProfileValue(initialValues[field])
  );
}

//===================================================================

export function isChangePasswordFormDirty(
  values: ChangePasswordFormValues
): boolean {
  return CHANGE_PASSWORD_FORM_FIELDS.some((field) => values[field].length > 0);
}

//===================================================================

export function isDataProfileFormValid(values: DataProfileFormValues): boolean {
  return isValidationResultValid(validateDataProfileForm(values));
}

//===================================================================

export function isChangePasswordFormValid(
  values: ChangePasswordFormValues
): boolean {
  return (
    isChangePasswordFormDirty(values) &&
    isValidationResultValid(validateChangePasswordForm(values))
  );
}

//===================================================================

export function validateDataProfileForm(
  values: DataProfileFormValues
): DataProfileFormErrors {
  const errors: DataProfileFormErrors = {};

  const nameError = buildUserNameError(values.name, { required: true });
  const phoneError = buildPhoneError(values.phone, { required: true });
  const addressError = buildAddressError(values.address);

  if (nameError) errors.name = nameError;
  if (phoneError) errors.phone = phoneError;
  if (addressError) errors.address = addressError;

  return errors;
}

//===================================================================

export function validateChangePasswordForm(
  values: ChangePasswordFormValues
): ChangePasswordFormErrors {
  const errors: ChangePasswordFormErrors = {};
  const { currentPassword, newPassword } = values;

  if (!currentPassword && !newPassword) return errors;

  const currentPasswordError = buildRequiredPasswordError(
    currentPassword,
    VALIDATION_MESSAGES.required.currentPassword
  );

  if (currentPasswordError) errors.currentPassword = currentPasswordError;

  const newPasswordError = buildPasswordError(newPassword);
  if (newPasswordError) errors.newPassword = newPasswordError;

  return errors;
}

//===================================================================

export {
  USER_NAME_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_ADDRESS_MAX_LENGTH,
};
