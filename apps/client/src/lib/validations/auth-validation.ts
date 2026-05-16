export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 20;

export const USER_NAME_MIN_LENGTH = 2;
export const USER_NAME_MAX_LENGTH = 20;

export const EMAIL_MAX_LENGTH = 64;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

//===================================================================

export type LoginFormValues = {
  email: string;
  password: string;
};

export type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
};

export type ForgotPasswordFormValues = {
  email: string;
};

//===================================================================

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export type RegisterFormErrors = Partial<
  Record<keyof RegisterFormValues, string>
>;

export type ForgotPasswordFormErrors = Partial<
  Record<keyof ForgotPasswordFormValues, string>
>;

//===================================================================

export const LOGIN_INITIAL_VALUES: LoginFormValues = {
  email: '',
  password: '',
};

export const REGISTER_INITIAL_VALUES: RegisterFormValues = {
  name: '',
  email: '',
  password: '',
};

export const FORGOT_PASSWORD_INITIAL_VALUES: ForgotPasswordFormValues = {
  email: '',
};

//===================================================================

export function sanitizeEmail(value: string): string {
  return value.trimStart().replace(/\s/g, '').slice(0, EMAIL_MAX_LENGTH);
}

export function getEmailError(value: string): string {
  const email = value.trim();

  if (!email) return 'Email is required';

  if (email.length > EMAIL_MAX_LENGTH) {
    return `Email must be at most ${EMAIL_MAX_LENGTH} characters`;
  }

  if (!EMAIL_REGEX.test(email)) return 'Enter a valid email address';

  return '';
}

//===================================================================

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  const emailError = getEmailError(values.email);
  const password = values.password.trim();

  if (emailError) errors.email = emailError;

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }

  return errors;
}

//===================================================================

export function validateRegisterForm(
  values: RegisterFormValues
): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  const name = values.name.trim();
  const emailError = getEmailError(values.email);
  const password = values.password;

  if (!name) {
    errors.name = 'Name is required';
  } else if (name.length < USER_NAME_MIN_LENGTH) {
    errors.name = `Name must be at least ${USER_NAME_MIN_LENGTH} characters`;
  } else if (name.length > USER_NAME_MAX_LENGTH) {
    errors.name = `Name must be at most ${USER_NAME_MAX_LENGTH} characters`;
  } else if (!NAME_REGEX.test(name)) {
    errors.name = 'Use only Latin letters, spaces, apostrophe or hyphen';
  }

  if (emailError) errors.email = emailError;

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  }

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
