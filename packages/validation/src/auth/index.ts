export * from './auth-validation';

export {
  hasValidationErrors,
  markAllFieldsTouched,
} from '../shared/form-utils';

export {
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
} from '../shared/limits';

export { normalizeEmail, normalizePhoneInput } from '../shared/sanitizers';
