import { DELIVERY_PAYMENT_INFO } from './delivery-payment';
import { PERSONAL_DATA_NOTICE_INFO } from './personal-data-notice';
import { RETURN_POLICY_INFO } from './return-policy';
import { USER_AGREEMENT_INFO } from './user-agreement';

//===================================================================

export const INFO_DOCUMENTS = [
  DELIVERY_PAYMENT_INFO,
  PERSONAL_DATA_NOTICE_INFO,
  RETURN_POLICY_INFO,
  USER_AGREEMENT_INFO,
] as const;
