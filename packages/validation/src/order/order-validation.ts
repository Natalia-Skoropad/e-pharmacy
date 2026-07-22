import {
  buildAddressError,
  buildUserNameError,
  buildOrderCommentError,
  buildPhoneError,
  isValidationResultValid,
  type FormErrors,
  type FormTouchedFields,
} from '../shared';

import type { DeliveryMethod } from '@e-pharmacy/types/orders';

//===================================================================

export type OrderDeliveryFormValues = {
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  comment: string;
};

//===================================================================

export type OrderDeliveryFormErrors = FormErrors<OrderDeliveryFormValues>;

export type OrderDeliveryTouchedFields =
  FormTouchedFields<OrderDeliveryFormValues>;

//===================================================================

export const ORDER_DELIVERY_INITIAL_VALUES: OrderDeliveryFormValues = {
  recipientName: '',
  recipientPhone: '',
  deliveryAddress: '',
  comment: '',
};

//===================================================================

export const ORDER_DELIVERY_FORM_FIELDS: Array<keyof OrderDeliveryFormValues> =
  ['recipientName', 'recipientPhone', 'deliveryAddress', 'comment'];

//===================================================================

export function validateOrderDeliveryForm(
  values: OrderDeliveryFormValues,
  deliveryMethod: DeliveryMethod
): OrderDeliveryFormErrors {
  const errors: OrderDeliveryFormErrors = {};

  const commentError = buildOrderCommentError(values.comment, {
    trailingDot: true,
  });

  if (commentError) errors.comment = commentError;
  if (deliveryMethod === 'pickup') return errors;

  const nameError = buildUserNameError(values.recipientName, {
    required: true,
    trailingDot: true,
  });

  const phoneError = buildPhoneError(values.recipientPhone, {
    required: true,
    trailingDot: true,
  });

  const addressError = buildAddressError(values.deliveryAddress, {
    required: true,
    trailingDot: true,
  });

  if (nameError) errors.recipientName = nameError;
  if (phoneError) errors.recipientPhone = phoneError;
  if (addressError) errors.deliveryAddress = addressError;

  return errors;
}

//===================================================================

export function isOrderDeliveryFormValid(
  values: OrderDeliveryFormValues,
  deliveryMethod: DeliveryMethod
): boolean {
  return isValidationResultValid(
    validateOrderDeliveryForm(values, deliveryMethod)
  );
}
