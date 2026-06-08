import {
  buildNameError,
  buildPhoneError,
  buildAddressError,
  buildPasswordError,
  VALIDATION_MESSAGES,
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

export type DataProfileFormErrors = Partial<
  Record<keyof DataProfileFormValues, string>
>;

export type ChangePasswordFormErrors = Partial<
  Record<keyof ChangePasswordFormValues, string>
>;

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

export function validateDataProfileForm(
  values: DataProfileFormValues
): DataProfileFormErrors {
  const errors: DataProfileFormErrors = {};

  const nameError = buildNameError(values.name, {
    required: true,
    trailingDot: true,
  });

  const phoneError = buildPhoneError(values.phone, { trailingDot: true });
  const addressError = buildAddressError(values.address, { trailingDot: true });

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
  const currentPassword = values.currentPassword;
  const newPassword = values.newPassword;

  if (!currentPassword && !newPassword) return errors;

  if (!currentPassword) {
    errors.currentPassword = VALIDATION_MESSAGES.required.currentPassword;
  } else {
    const currentPasswordError = buildPasswordError(currentPassword);
    if (currentPasswordError) errors.currentPassword = currentPasswordError;
  }

  const newPasswordError = buildPasswordError(newPassword);
  if (newPasswordError) errors.newPassword = newPasswordError;

  return errors;
}
