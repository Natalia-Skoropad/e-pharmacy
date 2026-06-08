import {
  buildNameError,
  buildEmailError,
  buildPhoneError,
  buildPasswordError,
  VALIDATION_MESSAGES,
} from '../shared';

//===================================================================

export type RegisterFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginFormValues = {
  email: string;
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

export type RegisterFormErrors = Partial<
  Record<keyof RegisterFormValues, string>
>;

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export type ForgotPasswordFormErrors = Partial<
  Record<keyof ForgotPasswordFormValues, string>
>;

export type ResetPasswordFormErrors = Partial<
  Record<keyof ResetPasswordFormValues, string>
>;

//===================================================================

export const REGISTER_INITIAL_VALUES: RegisterFormValues = {
  name: '',
  email: '',
  phone: '',
  password: '',
};

export const LOGIN_INITIAL_VALUES: LoginFormValues = {
  email: '',
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

export function validateRegisterForm(
  values: RegisterFormValues
): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  const nameError = buildNameError(values.name, { required: true });
  const emailError = buildEmailError(values.email);
  const phoneError = buildPhoneError(values.phone, { required: true });
  const passwordError = buildPasswordError(values.password);

  if (nameError) errors.name = nameError;
  if (emailError) errors.email = emailError;
  if (phoneError) errors.phone = phoneError;
  if (passwordError) errors.password = passwordError;

  return errors;
}

//===================================================================

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  const emailError = buildEmailError(values.email);
  const passwordError = buildPasswordError(values.password.trim());

  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;

  return errors;
}

//===================================================================

export function validateForgotPasswordForm(
  values: ForgotPasswordFormValues
): ForgotPasswordFormErrors {
  const errors: ForgotPasswordFormErrors = {};

  const emailError = buildEmailError(values.email);
  if (emailError) errors.email = emailError;

  return errors;
}

//===================================================================

export function validateResetPasswordForm(
  values: ResetPasswordFormValues
): ResetPasswordFormErrors {
  const errors: ResetPasswordFormErrors = {};

  const passwordError = buildPasswordError(values.password);
  if (passwordError) errors.password = passwordError;

  if (!values.confirmPassword) {
    errors.confirmPassword = VALIDATION_MESSAGES.required.confirmPassword;
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = VALIDATION_MESSAGES.format.passwordMatch;
  }

  return errors;
}
