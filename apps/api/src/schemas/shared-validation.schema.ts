import { z } from 'zod';

import {
  ADDRESS_PATTERN,
  MAX_REVIEW_RATING,
  MIN_REVIEW_RATING,
  BANK_NAME_PATTERN,
  BANK_RECIPIENT_NAME_PATTERN,
  PHARMACY_NAME_PATTERN,
  USER_NAME_PATTERN,
  ORDER_COMMENT_PATTERN,
  PAYMENT_PURPOSE_PATTERN,
  PASSWORD_PATTERN,
  PHONE_PATTERN,
  REVIEW_COMMENT_PATTERN,
  SEARCH_TEXT_PATTERN,
  TAX_ID_PATTERN,
  IBAN_PATTERN,
  WORKING_HOURS_PATTERN,
  TEXT_EDITOR_PATTERN,
  USER_ADDRESS_MAX_LENGTH,
  USER_ADDRESS_MIN_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_NAME_MIN_LENGTH,
  PHARMACY_NAME_MAX_LENGTH,
  PHARMACY_NAME_MIN_LENGTH,
  BANK_RECIPIENT_NAME_MAX_LENGTH,
  BANK_RECIPIENT_NAME_MIN_LENGTH,
  BANK_NAME_MAX_LENGTH,
  BANK_NAME_MIN_LENGTH,
  USER_ORDER_COMMENT_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PASSWORD_MIN_LENGTH,
  USER_PHONE_MAX_LENGTH,
  PICTURE_URL_MAX_LENGTH,
  USER_REVIEW_COMMENT_MAX_LENGTH,
  USER_REVIEW_COMMENT_MIN_LENGTH,
  USER_SEARCH_MAX_LENGTH,
  WORKING_HOURS_MAX_LENGTH,
  TEXT_EDITOR_MAX_LENGTH,
  TAX_ID_MIN_LENGTH,
  TAX_ID_MAX_LENGTH,
  IBAN_MAX_LENGTH,
  PAYMENT_PURPOSE_MAX_LENGTH,
  VALIDATION_MESSAGES,
  isHttpUrl,
  isPictureDataUrl,
} from '../constants/validation';

//===============================================================

export const sharedUserNameSchema = z
  .string()
  .trim()
  .min(USER_NAME_MIN_LENGTH, VALIDATION_MESSAGES.limits.nameMin)
  .max(USER_NAME_MAX_LENGTH, VALIDATION_MESSAGES.limits.nameMax)
  .regex(USER_NAME_PATTERN, VALIDATION_MESSAGES.format.name);

//===============================================================

export const sharedPharmacyNameSchema = z
  .string()
  .trim()
  .min(PHARMACY_NAME_MIN_LENGTH, VALIDATION_MESSAGES.limits.pharmacyNameMin)
  .max(PHARMACY_NAME_MAX_LENGTH, VALIDATION_MESSAGES.limits.pharmacyNameMax)
  .regex(PHARMACY_NAME_PATTERN, VALIDATION_MESSAGES.format.pharmacyName);

//===============================================================

export const sharedBankRecipientNameSchema = z
  .string()
  .trim()
  .min(
    BANK_RECIPIENT_NAME_MIN_LENGTH,
    VALIDATION_MESSAGES.limits.bankRecipientNameMin
  )
  .max(
    BANK_RECIPIENT_NAME_MAX_LENGTH,
    VALIDATION_MESSAGES.limits.bankRecipientNameMax
  )
  .regex(
    BANK_RECIPIENT_NAME_PATTERN,
    VALIDATION_MESSAGES.format.bankRecipientName
  );

//===============================================================

export const sharedBankNameSchema = z
  .string()
  .trim()
  .min(BANK_NAME_MIN_LENGTH, VALIDATION_MESSAGES.limits.bankNameMin)
  .max(BANK_NAME_MAX_LENGTH, VALIDATION_MESSAGES.limits.bankNameMax)
  .regex(BANK_NAME_PATTERN, VALIDATION_MESSAGES.format.bankName);

//===============================================================

export const sharedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email(VALIDATION_MESSAGES.format.emailApi)
  .max(USER_EMAIL_MAX_LENGTH, VALIDATION_MESSAGES.limits.emailMax);

//===============================================================

export const sharedRequiredPhoneSchema = z
  .string()
  .trim()
  .min(1, VALIDATION_MESSAGES.required.phone)
  .max(USER_PHONE_MAX_LENGTH, VALIDATION_MESSAGES.limits.phoneMax)
  .regex(PHONE_PATTERN, VALIDATION_MESSAGES.format.phone);

//===============================================================

export const sharedPasswordSchema = z
  .string()
  .min(USER_PASSWORD_MIN_LENGTH, VALIDATION_MESSAGES.limits.passwordMin)
  .max(USER_PASSWORD_MAX_LENGTH, VALIDATION_MESSAGES.limits.passwordMax)
  .regex(PASSWORD_PATTERN, VALIDATION_MESSAGES.format.password);

//===============================================================

export const sharedRequiredPasswordSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.required.password);

//===============================================================

export const sharedRequiredAddressSchema = z
  .string()
  .trim()
  .min(USER_ADDRESS_MIN_LENGTH, VALIDATION_MESSAGES.limits.addressMin)
  .max(USER_ADDRESS_MAX_LENGTH, VALIDATION_MESSAGES.limits.addressMax)
  .regex(ADDRESS_PATTERN, VALIDATION_MESSAGES.format.address);

//===============================================================

export const sharedOptionalAddressSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;

  const normalizedValue = value.trim();
  return normalizedValue === '' ? undefined : normalizedValue;
}, sharedRequiredAddressSchema.optional());

//===============================================================

export const sharedReviewCommentSchema = z
  .string()
  .trim()
  .min(
    USER_REVIEW_COMMENT_MIN_LENGTH,
    VALIDATION_MESSAGES.limits.reviewCommentMin
  )
  .max(
    USER_REVIEW_COMMENT_MAX_LENGTH,
    VALIDATION_MESSAGES.limits.reviewCommentMax
  )
  .regex(REVIEW_COMMENT_PATTERN, VALIDATION_MESSAGES.format.reviewComment);

//===============================================================

export const sharedReviewRatingSchema = z.coerce
  .number()
  .int(VALIDATION_MESSAGES.format.reviewRating)
  .min(MIN_REVIEW_RATING, VALIDATION_MESSAGES.format.reviewRating)
  .max(MAX_REVIEW_RATING, VALIDATION_MESSAGES.format.reviewRating);

//===============================================================

export const sharedOrderCommentSchema = z
  .string()
  .trim()
  .max(
    USER_ORDER_COMMENT_MAX_LENGTH,
    VALIDATION_MESSAGES.limits.orderCommentMax
  )
  .regex(ORDER_COMMENT_PATTERN, VALIDATION_MESSAGES.format.orderComment)
  .optional();

//===============================================================

export const sharedPictureUrlSchema = z
  .string()
  .trim()
  .max(PICTURE_URL_MAX_LENGTH, VALIDATION_MESSAGES.limits.picturePayloadMax)
  .refine(
    (value: string) => isPictureDataUrl(value) || isHttpUrl(value),
    VALIDATION_MESSAGES.format.picture
  )
  .optional()
  .nullable();

//===============================================================

export const sharedSearchSchema = z
  .string()
  .trim()
  .max(USER_SEARCH_MAX_LENGTH, VALIDATION_MESSAGES.limits.searchMax)
  .regex(SEARCH_TEXT_PATTERN, VALIDATION_MESSAGES.format.search)
  .optional();

//===============================================================

const WORKING_HOURS_RANGE_PATTERN =
  /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun):\s*(Closed|([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d)\b/g;

//===============================================================

function hasValidWorkingHoursRanges(value: string): boolean {
  const entries = [...value.matchAll(WORKING_HOURS_RANGE_PATTERN)];

  if (entries.length === 0) return true;

  return entries.every((entry) => {
    if (entry[1] === 'Closed') return true;

    const from = entry[2];
    const to = entry[3];

    return Boolean(from && to && from < to);
  });
}

//===============================================================

export const sharedWorkingHoursSchema = z
  .string()
  .trim()
  .min(1, VALIDATION_MESSAGES.required.workingHours)
  .max(WORKING_HOURS_MAX_LENGTH, VALIDATION_MESSAGES.limits.workingHoursMax)
  .regex(WORKING_HOURS_PATTERN, VALIDATION_MESSAGES.format.workingHours)
  .refine(
    hasValidWorkingHoursRanges,
    VALIDATION_MESSAGES.format.workingHoursRange
  );

//===============================================================

export const sharedTextEditorSchema = z
  .string()
  .trim()
  .min(1, VALIDATION_MESSAGES.required.textEditor)
  .max(TEXT_EDITOR_MAX_LENGTH, VALIDATION_MESSAGES.limits.textEditorMax)
  .regex(TEXT_EDITOR_PATTERN, VALIDATION_MESSAGES.format.textEditor);

//===============================================================

export const sharedTaxIdSchema = z
  .string()
  .trim()
  .min(TAX_ID_MIN_LENGTH, VALIDATION_MESSAGES.format.taxId)
  .max(TAX_ID_MAX_LENGTH, VALIDATION_MESSAGES.format.taxId)
  .regex(TAX_ID_PATTERN, VALIDATION_MESSAGES.format.taxId);

//===============================================================

export const sharedIbanSchema = z
  .string()
  .trim()
  .toUpperCase()
  .max(IBAN_MAX_LENGTH, VALIDATION_MESSAGES.format.iban)
  .regex(IBAN_PATTERN, VALIDATION_MESSAGES.format.iban);

//===============================================================

export const sharedPaymentPurposeSchema = z
  .string()
  .trim()
  .min(1, VALIDATION_MESSAGES.required.paymentPurpose)
  .max(PAYMENT_PURPOSE_MAX_LENGTH, VALIDATION_MESSAGES.limits.paymentPurposeMax)
  .regex(PAYMENT_PURPOSE_PATTERN, VALIDATION_MESSAGES.format.paymentPurpose);

//===============================================================

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const normalizedValue = value.trim();
  return normalizedValue === '' ? undefined : normalizedValue;
}

//===============================================================

export const sharedOptionalWorkingHoursSchema = z.preprocess(
  emptyStringToUndefined,
  sharedWorkingHoursSchema.optional()
);

//===============================================================

export const sharedOptionalTextEditorSchema = z.preprocess(
  emptyStringToUndefined,
  sharedTextEditorSchema.optional()
);

//===============================================================

export const sharedOptionalTaxIdSchema = z.preprocess(
  emptyStringToUndefined,
  sharedTaxIdSchema.optional()
);

//===============================================================

export const sharedOptionalIbanSchema = z.preprocess(
  emptyStringToUndefined,
  sharedIbanSchema.optional()
);

//===============================================================

export const sharedOptionalPaymentPurposeSchema = z.preprocess(
  emptyStringToUndefined,
  sharedPaymentPurposeSchema.optional()
);
