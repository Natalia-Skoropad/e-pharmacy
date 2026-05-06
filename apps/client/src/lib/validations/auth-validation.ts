const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//===================================================================

export type LoginFormValues = {
  email: string;
  password: string;
};

//===================================================================

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

//===================================================================

export const LOGIN_INITIAL_VALUES: LoginFormValues = {
  email: '',
  password: '',
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
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return errors;
}
