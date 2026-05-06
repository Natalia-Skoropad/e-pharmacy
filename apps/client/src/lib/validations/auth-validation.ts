const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;
const USER_NAME_MIN_LENGTH = 2;
const USER_NAME_MAX_LENGTH = 64;
const EMAIL_MAX_LENGTH = 254;
const PHONE_MAX_LENGTH = 20;

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
  confirmPassword: string;
};

//===================================================================

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export type RegisterFormErrors = Partial<
  Record<keyof RegisterFormValues, string>
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
  confirmPassword: '',
};

//===================================================================

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  const email = values.email.trim();
  const password = values.password.trim();

  if (!email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Enter a valid email address';
  }

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
  const email = values.email.trim();
  const phone = values.phone.trim();
  const password = values.password;
  const confirmPassword = values.confirmPassword;

  if (!name) {
    errors.name = 'Name is required';
  } else if (name.length < USER_NAME_MIN_LENGTH) {
    errors.name = `Name must be at least ${USER_NAME_MIN_LENGTH} characters`;
  } else if (name.length > USER_NAME_MAX_LENGTH) {
    errors.name = `Name must be at most ${USER_NAME_MAX_LENGTH} characters`;
  }

  if (!email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Enter a valid email address';
  } else if (email.length > EMAIL_MAX_LENGTH) {
    errors.email = `Email must be at most ${EMAIL_MAX_LENGTH} characters`;
  }

  if (phone && phone.length > PHONE_MAX_LENGTH) {
    errors.phone = `Phone must be at most ${PHONE_MAX_LENGTH} characters`;
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}
