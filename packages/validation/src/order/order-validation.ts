import {
  buildAddressError,
  buildNameError,
  buildOrderCommentError,
  buildPhoneError,
} from '../shared';

//===================================================================

export type OrderDeliveryMethod = 'pickup' | 'post';

export type OrderDeliveryFormValues = {
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  comment: string;
};

export type OrderDeliveryFormErrors = Partial<
  Record<keyof OrderDeliveryFormValues, string>
>;

//===================================================================

export const ORDER_DELIVERY_INITIAL_VALUES: OrderDeliveryFormValues = {
  recipientName: '',
  recipientPhone: '',
  deliveryAddress: '',
  comment: '',
};

//===================================================================

export function validateOrderDeliveryForm(
  values: OrderDeliveryFormValues,
  deliveryMethod: OrderDeliveryMethod
): OrderDeliveryFormErrors {
  const errors: OrderDeliveryFormErrors = {};

  const commentError = buildOrderCommentError(values.comment, {
    trailingDot: true,
  });

  if (commentError) errors.comment = commentError;
  if (deliveryMethod === 'pickup') return errors;

  const nameError = buildNameError(values.recipientName, {
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
  deliveryMethod: OrderDeliveryMethod
): boolean {
  return (
    Object.keys(validateOrderDeliveryForm(values, deliveryMethod)).length ===
    0
  );
}
