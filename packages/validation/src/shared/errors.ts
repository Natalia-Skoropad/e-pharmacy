import {
  PICTURE_ALLOWED_MIME_TYPES,
  PICTURE_DATA_URL_MAX_LENGTH,
  PICTURE_FILE_MAX_BYTES,
  PICTURE_HTTP_URL_MAX_LENGTH,
  isHttpUrl,
  isPictureDataUrl,
} from '../picture';

import { getWorkingHoursValidationIssue } from './working-hours';

import {
  BANK_NAME_MAX_LENGTH,
  BANK_NAME_MIN_LENGTH,
  BANK_RECIPIENT_NAME_MAX_LENGTH,
  BANK_RECIPIENT_NAME_MIN_LENGTH,
  MAX_REVIEW_RATING,
  MIN_REVIEW_RATING,
  USER_ADDRESS_MAX_LENGTH,
  USER_ADDRESS_MIN_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  PHARMACY_NAME_MAX_LENGTH,
  PHARMACY_NAME_MIN_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_NAME_MIN_LENGTH,
  USER_ORDER_COMMENT_MAX_LENGTH,
  WORKING_HOURS_MAX_LENGTH,
  TEXT_EDITOR_MAX_LENGTH,
  PAYMENT_PURPOSE_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PASSWORD_MIN_LENGTH,
  USER_PHONE_MAX_LENGTH,
  USER_REVIEW_COMMENT_MAX_LENGTH,
  USER_REVIEW_COMMENT_MIN_LENGTH,
} from './limits';

import {
  ADDRESS_PATTERN,
  BANK_NAME_PATTERN,
  BANK_RECIPIENT_NAME_PATTERN,
  EMAIL_PATTERN,
  PHARMACY_NAME_PATTERN,
  USER_NAME_PATTERN,
  ORDER_COMMENT_PATTERN,
  PAYMENT_PURPOSE_PATTERN,
  PASSWORD_PATTERN,
  PHONE_PATTERN,
  TAX_ID_PATTERN,
  IBAN_PATTERN,
  WORKING_HOURS_PATTERN,
  TEXT_EDITOR_PATTERN,
  REVIEW_COMMENT_PATTERN,
} from './patterns';

import { VALIDATION_MESSAGES } from './messages';

//=============================================================================

type NameErrorOptions = { required?: boolean; trailingDot?: boolean };

//=============================================================================

function formatValidationMessage(
  message: string,
  options: { trailingDot?: boolean } = {}
): string {
  return options.trailingDot ? `${message}.` : message;
}

//=============================================================================

function buildDomainNameError(
  value: string,
  config: Readonly<{
    minLength: number;
    maxLength: number;
    pattern: RegExp;
    requiredMessage: string;
    minMessage: string;
    maxMessage: string;
    formatMessage: string;
  }>,
  options: NameErrorOptions = {}
): string {
  const name = value.trim();

  if (!name) return options.required ? config.requiredMessage : '';

  if (name.length < config.minLength) {
    return formatValidationMessage(config.minMessage, options);
  }

  if (name.length > config.maxLength) {
    return formatValidationMessage(config.maxMessage, options);
  }

  if (!config.pattern.test(name)) {
    return formatValidationMessage(config.formatMessage, options);
  }

  return '';
}

//=============================================================================

export function buildUserNameError(
  value: string,
  options: NameErrorOptions = {}
): string {
  return buildDomainNameError(
    value,
    {
      minLength: USER_NAME_MIN_LENGTH,
      maxLength: USER_NAME_MAX_LENGTH,
      pattern: USER_NAME_PATTERN,
      requiredMessage: VALIDATION_MESSAGES.required.name,
      minMessage: VALIDATION_MESSAGES.limits.nameMin,
      maxMessage: VALIDATION_MESSAGES.limits.nameMax,
      formatMessage: VALIDATION_MESSAGES.format.name,
    },
    options
  );
}

//=============================================================================

export function buildPharmacyNameError(
  value: string,
  options: NameErrorOptions = {}
): string {
  return buildDomainNameError(
    value,
    {
      minLength: PHARMACY_NAME_MIN_LENGTH,
      maxLength: PHARMACY_NAME_MAX_LENGTH,
      pattern: PHARMACY_NAME_PATTERN,
      requiredMessage: VALIDATION_MESSAGES.required.pharmacyName,
      minMessage: VALIDATION_MESSAGES.limits.pharmacyNameMin,
      maxMessage: VALIDATION_MESSAGES.limits.pharmacyNameMax,
      formatMessage: VALIDATION_MESSAGES.format.pharmacyName,
    },
    options
  );
}

//=============================================================================

export function buildBankRecipientNameError(
  value: string,
  options: NameErrorOptions = {}
): string {
  return buildDomainNameError(
    value,
    {
      minLength: BANK_RECIPIENT_NAME_MIN_LENGTH,
      maxLength: BANK_RECIPIENT_NAME_MAX_LENGTH,
      pattern: BANK_RECIPIENT_NAME_PATTERN,
      requiredMessage: VALIDATION_MESSAGES.required.bankRecipientName,
      minMessage: VALIDATION_MESSAGES.limits.bankRecipientNameMin,
      maxMessage: VALIDATION_MESSAGES.limits.bankRecipientNameMax,
      formatMessage: VALIDATION_MESSAGES.format.bankRecipientName,
    },
    options
  );
}

//=============================================================================

export function buildBankNameError(
  value: string,
  options: NameErrorOptions = {}
): string {
  return buildDomainNameError(
    value,
    {
      minLength: BANK_NAME_MIN_LENGTH,
      maxLength: BANK_NAME_MAX_LENGTH,
      pattern: BANK_NAME_PATTERN,
      requiredMessage: VALIDATION_MESSAGES.required.bankName,
      minMessage: VALIDATION_MESSAGES.limits.bankNameMin,
      maxMessage: VALIDATION_MESSAGES.limits.bankNameMax,
      formatMessage: VALIDATION_MESSAGES.format.bankName,
    },
    options
  );
}

//=============================================================================

export function buildEmailError(value: string): string {
  const email = value.trim();

  if (!email) return VALIDATION_MESSAGES.required.email;

  if (email.length > USER_EMAIL_MAX_LENGTH) {
    return VALIDATION_MESSAGES.limits.emailMax;
  }

  if (!EMAIL_PATTERN.test(email)) return VALIDATION_MESSAGES.format.email;

  return '';
}

//=============================================================================

export function buildPhoneError(
  value: string,
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const phone = value.trim();

  if (!phone) return options.required ? VALIDATION_MESSAGES.required.phone : '';

  if (phone.length > USER_PHONE_MAX_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.phoneMax;
    return formatValidationMessage(message, options);
  }

  if (!PHONE_PATTERN.test(phone)) {
    const message = VALIDATION_MESSAGES.format.phone;
    return formatValidationMessage(message, options);
  }

  return '';
}

//=============================================================================

export function buildPasswordError(value: string): string {
  if (!value) return VALIDATION_MESSAGES.required.password;

  if (value.length < USER_PASSWORD_MIN_LENGTH) {
    return VALIDATION_MESSAGES.limits.passwordMin;
  }

  if (value.length > USER_PASSWORD_MAX_LENGTH) {
    return VALIDATION_MESSAGES.limits.passwordMax;
  }

  if (!PASSWORD_PATTERN.test(value)) {
    return VALIDATION_MESSAGES.format.password;
  }

  return '';
}

//=============================================================================

export function buildRequiredPasswordError(
  value: string,
  message: string = VALIDATION_MESSAGES.required.password
): string {
  return value ? '' : message;
}

//=============================================================================

export function buildAddressError(
  value: string,
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const address = value.trim();

  if (!address) {
    return options.required ? VALIDATION_MESSAGES.required.address : '';
  }

  if (address.length < USER_ADDRESS_MIN_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.addressMin;
    return formatValidationMessage(message, options);
  }

  if (address.length > USER_ADDRESS_MAX_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.addressMax;
    return formatValidationMessage(message, options);
  }

  if (!ADDRESS_PATTERN.test(address)) {
    const message = VALIDATION_MESSAGES.format.address;
    return formatValidationMessage(message, options);
  }

  return '';
}

//=============================================================================

export function buildReviewCommentError(
  value: string,
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const comment = value.trim();

  if (!comment) {
    return options.required ? VALIDATION_MESSAGES.required.reviewComment : '';
  }

  if (comment.length < USER_REVIEW_COMMENT_MIN_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.reviewCommentMin;
    return formatValidationMessage(message, options);
  }

  if (comment.length > USER_REVIEW_COMMENT_MAX_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.reviewCommentMax;
    return formatValidationMessage(message, options);
  }

  if (!REVIEW_COMMENT_PATTERN.test(comment)) {
    const message = VALIDATION_MESSAGES.format.reviewComment;
    return formatValidationMessage(message, options);
  }

  return '';
}

//=============================================================================

export function buildReviewRatingError(value: number): string {
  return Number.isInteger(value) &&
    value >= MIN_REVIEW_RATING &&
    value <= MAX_REVIEW_RATING
    ? ''
    : VALIDATION_MESSAGES.format.reviewRating;
}

//=============================================================================

export function buildOrderCommentError(
  value: string,
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const comment = value.trim();

  if (!comment) {
    return options.required ? VALIDATION_MESSAGES.required.orderComment : '';
  }

  if (comment.length > USER_ORDER_COMMENT_MAX_LENGTH) {
    const message = VALIDATION_MESSAGES.limits.orderCommentMax;
    return formatValidationMessage(message, options);
  }

  if (!ORDER_COMMENT_PATTERN.test(comment)) {
    const message = VALIDATION_MESSAGES.format.orderComment;
    return formatValidationMessage(message, options);
  }

  return '';
}

//=============================================================================

export function buildWorkingHoursError(
  value: string,
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const workingHours = value.trim();

  if (!workingHours) {
    return options.required
      ? formatValidationMessage(
          VALIDATION_MESSAGES.required.workingHours,
          options
        )
      : '';
  }

  if (workingHours.length > WORKING_HOURS_MAX_LENGTH) {
    return formatValidationMessage(
      VALIDATION_MESSAGES.limits.workingHoursMax,
      options
    );
  }

  if (!WORKING_HOURS_PATTERN.test(workingHours)) {
    return formatValidationMessage(
      VALIDATION_MESSAGES.format.workingHours,
      options
    );
  }

  const validationIssue = getWorkingHoursValidationIssue(workingHours);

  if (validationIssue === 'missing-days') {
    return formatValidationMessage(
      VALIDATION_MESSAGES.format.workingHoursMissingDays,
      options
    );
  }

  if (validationIssue === 'duplicate-days') {
    return formatValidationMessage(
      VALIDATION_MESSAGES.format.workingHoursDuplicateDays,
      options
    );
  }

  if (validationIssue === 'range') {
    return formatValidationMessage(
      VALIDATION_MESSAGES.format.workingHoursRange,
      options
    );
  }

  if (validationIssue === 'format') {
    return formatValidationMessage(
      VALIDATION_MESSAGES.format.workingHours,
      options
    );
  }

  return '';
}

//=============================================================================

export function buildTextEditorError(
  value: string,
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const text = value.trim();

  if (!text) {
    return options.required
      ? formatValidationMessage(
          VALIDATION_MESSAGES.required.textEditor,
          options
        )
      : '';
  }

  if (text.length > TEXT_EDITOR_MAX_LENGTH) {
    return formatValidationMessage(
      VALIDATION_MESSAGES.limits.textEditorMax,
      options
    );
  }

  if (!TEXT_EDITOR_PATTERN.test(text)) {
    return formatValidationMessage(
      VALIDATION_MESSAGES.format.textEditor,
      options
    );
  }

  return '';
}

//=============================================================================

export function buildTaxIdError(
  value: string,
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const taxId = value.trim();

  if (!taxId) {
    return options.required
      ? formatValidationMessage(VALIDATION_MESSAGES.required.taxId, options)
      : '';
  }

  if (!TAX_ID_PATTERN.test(taxId)) {
    return formatValidationMessage(VALIDATION_MESSAGES.format.taxId, options);
  }

  return '';
}

//=============================================================================

export function buildIbanError(
  value: string,
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const iban = value.trim().toUpperCase();

  if (!iban) {
    return options.required
      ? formatValidationMessage(VALIDATION_MESSAGES.required.iban, options)
      : '';
  }

  if (!IBAN_PATTERN.test(iban)) {
    return formatValidationMessage(VALIDATION_MESSAGES.format.iban, options);
  }

  return '';
}

//=============================================================================

export function buildPaymentPurposeError(
  value: string,
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const paymentPurpose = value.trim();

  if (!paymentPurpose) {
    return options.required
      ? formatValidationMessage(
          VALIDATION_MESSAGES.required.paymentPurpose,
          options
        )
      : '';
  }

  if (paymentPurpose.length > PAYMENT_PURPOSE_MAX_LENGTH) {
    return formatValidationMessage(
      VALIDATION_MESSAGES.limits.paymentPurposeMax,
      options
    );
  }

  if (!PAYMENT_PURPOSE_PATTERN.test(paymentPurpose)) {
    return formatValidationMessage(
      VALIDATION_MESSAGES.format.paymentPurpose,
      options
    );
  }

  return '';
}

//=============================================================================

export function buildPictureFileError(file: File): string {
  if (
    !PICTURE_ALLOWED_MIME_TYPES.some(
      (allowedType) => allowedType === file.type
    )
  ) {
    return VALIDATION_MESSAGES.format.pictureFileType;
  }

  if (file.size > PICTURE_FILE_MAX_BYTES) {
    return VALIDATION_MESSAGES.limits.pictureFileSize;
  }

  return '';
}

//=============================================================================

export function buildPictureUrlError(
  value: string,
  options: { required?: boolean; trailingDot?: boolean } = {}
): string {
  const pictureUrl = value.trim();

  if (!pictureUrl) {
    return options.required ? VALIDATION_MESSAGES.required.picture : '';
  }

  if (isPictureDataUrl(pictureUrl)) {
    if (pictureUrl.length > PICTURE_DATA_URL_MAX_LENGTH) {
      return formatValidationMessage(
        VALIDATION_MESSAGES.limits.pictureDataUrlMax,
        options
      );
    }

    return '';
  }

  if (isHttpUrl(pictureUrl)) {
    if (pictureUrl.length > PICTURE_HTTP_URL_MAX_LENGTH) {
      return formatValidationMessage(
        VALIDATION_MESSAGES.limits.pictureHttpUrlMax,
        options
      );
    }

    return '';
  }

  const message = VALIDATION_MESSAGES.format.picture;
  return formatValidationMessage(message, options);
}
