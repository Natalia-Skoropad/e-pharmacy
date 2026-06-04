import {
  VALIDATION_LIMITS,
  buildEmailError,
  buildNameError,
  buildPasswordError,
  buildPhoneError,
  sanitizeEmail as sanitizeSharedEmail,
  sanitizeName,
  sanitizePhone,
} from '../shared';

//===================================================================

export const PASSWORD_MIN_LENGTH = VALIDATION_LIMITS.passwordMin;
export const PASSWORD_MAX_LENGTH = VALIDATION_LIMITS.passwordMax;

export const USER_NAME_MIN_LENGTH = VALIDATION_LIMITS.nameMin;
export const USER_NAME_MAX_LENGTH = VALIDATION_LIMITS.nameMax;

export const CUSTOMER_NAME_MIN_LENGTH = USER_NAME_MIN_LENGTH;
export const CUSTOMER_NAME_MAX_LENGTH = USER_NAME_MAX_LENGTH;

export const EMAIL_MAX_LENGTH = VALIDATION_LIMITS.emailMax;

export const CUSTOMER_PHONE_MAX_LENGTH = VALIDATION_LIMITS.phoneMax;

//===================================================================

export type LoginFormValues = {
  email: string;
  password: string;
};

export type RegisterFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type ForgotPasswordFormValues = {
  email: string;
};

export type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

//===================================================================

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export type RegisterFormErrors = Partial<
  Record<keyof RegisterFormValues, string>
>;

export type ForgotPasswordFormErrors = Partial<
  Record<keyof ForgotPasswordFormValues, string>
>;

export type ResetPasswordFormErrors = Partial<
  Record<keyof ResetPasswordFormValues, string>
>;

//===================================================================

export const LOGIN_INITIAL_VALUES: LoginFormValues = {
  email: '',
  password: '',
};

export const REGISTER_INITIAL_VALUES: RegisterFormValues = {
  name: '',
  email: '',
  phone: '',
  password: '',
};

export const FORGOT_PASSWORD_INITIAL_VALUES: ForgotPasswordFormValues = {
  email: '',
};

export const RESET_PASSWORD_INITIAL_VALUES: ResetPasswordFormValues = {
  password: '',
  confirmPassword: '',
};

//===================================================================

export const sanitizeEmail = sanitizeSharedEmail;
export const sanitizeCustomerName = sanitizeName;
export const sanitizeCustomerPhone = sanitizePhone;

export const getEmailError = buildEmailError;
export const getPasswordError = buildPasswordError;

//===================================================================

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  const emailError = getEmailError(values.email);
  const passwordError = getPasswordError(values.password.trim());

  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;

  return errors;
}

//===================================================================

export function validateRegisterForm(
  values: RegisterFormValues
): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  const emailError = getEmailError(values.email);
  const nameError = buildNameError(values.name, { required: true });
  const phoneError = buildPhoneError(values.phone, { required: true });
  const passwordError = getPasswordError(values.password);

  if (nameError) errors.name = nameError;
  if (emailError) errors.email = emailError;
  if (phoneError) errors.phone = phoneError;
  if (passwordError) errors.password = passwordError;

  return errors;
}

//===================================================================

export function validateForgotPasswordForm(
  values: ForgotPasswordFormValues
): ForgotPasswordFormErrors {
  const errors: ForgotPasswordFormErrors = {};

  const emailError = getEmailError(values.email);

  if (emailError) errors.email = emailError;

  return errors;
}

//===================================================================

export function validateResetPasswordForm(
  values: ResetPasswordFormValues
): ResetPasswordFormErrors {
  const errors: ResetPasswordFormErrors = {};

  const passwordError = getPasswordError(values.password);

  if (passwordError) errors.password = passwordError;

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm password is required';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}
