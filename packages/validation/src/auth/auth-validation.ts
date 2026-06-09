import {
  buildNameError,
  buildEmailError,
  buildPhoneError,
  buildPasswordError,
  buildRequiredPasswordError,
  isValidationResultValid,
  VALIDATION_MESSAGES,
  type FormErrors,
  type FormTouchedFields,
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

export type RegisterFormErrors = FormErrors<RegisterFormValues>;
export type LoginFormErrors = FormErrors<LoginFormValues>;
export type ForgotPasswordFormErrors = FormErrors<ForgotPasswordFormValues>;
export type ResetPasswordFormErrors = FormErrors<ResetPasswordFormValues>;

//===================================================================

export type RegisterTouchedFields = FormTouchedFields<RegisterFormValues>;
export type LoginTouchedFields = FormTouchedFields<LoginFormValues>;
export type ForgotPasswordTouchedFields =
  FormTouchedFields<ForgotPasswordFormValues>;
export type ResetPasswordTouchedFields =
  FormTouchedFields<ResetPasswordFormValues>;

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

export const REGISTER_FORM_FIELDS: Array<keyof RegisterFormValues> = [
  'name',
  'email',
  'phone',
  'password',
];

export const LOGIN_FORM_FIELDS: Array<keyof LoginFormValues> = [
  'email',
  'password',
];

export const FORGOT_PASSWORD_FORM_FIELDS: Array<
  keyof ForgotPasswordFormValues
> = ['email'];

export const RESET_PASSWORD_FORM_FIELDS: Array<keyof ResetPasswordFormValues> =
  ['password', 'confirmPassword'];

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
  const passwordError = buildRequiredPasswordError(values.password);

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

//===================================================================

export function isRegisterFormValid(values: RegisterFormValues): boolean {
  return isValidationResultValid(validateRegisterForm(values));
}

export function isLoginFormValid(values: LoginFormValues): boolean {
  return isValidationResultValid(validateLoginForm(values));
}

export function isForgotPasswordFormValid(
  values: ForgotPasswordFormValues
): boolean {
  return isValidationResultValid(validateForgotPasswordForm(values));
}

export function isResetPasswordFormValid(
  values: ResetPasswordFormValues,
  token?: string
): boolean {
  return (
    Boolean(token) && isValidationResultValid(validateResetPasswordForm(values))
  );
}
