export * from './order-status-validation';
export * from './order-validation';

export {
  hasValidationErrors,
  markAllFieldsTouched,
} from '../shared/form-utils';

export {
  USER_ADDRESS_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_ORDER_COMMENT_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
} from '../shared/limits';

export { normalizePhoneInput } from '../shared/sanitizers';
