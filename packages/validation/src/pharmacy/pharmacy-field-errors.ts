import { getWorkingHoursValidationIssue } from './working-hours';

import {
  BANK_NAME_MAX_LENGTH,
  BANK_NAME_MIN_LENGTH,
  BANK_RECIPIENT_NAME_MAX_LENGTH,
  BANK_RECIPIENT_NAME_MIN_LENGTH,
  PAYMENT_PURPOSE_MAX_LENGTH,
  PHARMACY_NAME_MAX_LENGTH,
  PHARMACY_NAME_MIN_LENGTH,
  WORKING_HOURS_MAX_LENGTH,
} from '../shared/limits';

import { VALIDATION_MESSAGES } from '../shared/messages';

import {
  BANK_NAME_PATTERN,
  BANK_RECIPIENT_NAME_PATTERN,
  IBAN_PATTERN,
  PAYMENT_PURPOSE_PATTERN,
  PHARMACY_NAME_PATTERN,
  TAX_ID_PATTERN,
  WORKING_HOURS_PATTERN,
} from '../shared/patterns';

//===================================================================

type OptionalFieldOptions = Readonly<{ required?: boolean }>;

//===================================================================

type DomainNameRules = Readonly<{
  minLength: number;
  maxLength: number;
  pattern: RegExp;
  requiredMessage: string;
  minMessage: string;
  maxMessage: string;
  formatMessage: string;
}>;

//===================================================================

function buildDomainNameError(
  value: string,
  rules: DomainNameRules,
  options: OptionalFieldOptions
): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) return options.required ? rules.requiredMessage : '';
  if (normalizedValue.length < rules.minLength) return rules.minMessage;
  if (normalizedValue.length > rules.maxLength) return rules.maxMessage;
  if (!rules.pattern.test(normalizedValue)) return rules.formatMessage;

  return '';
}

//===================================================================

export function buildPharmacyNameError(
  value: string,
  options: OptionalFieldOptions = {}
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

//===================================================================

export function buildBankRecipientNameError(
  value: string,
  options: OptionalFieldOptions = {}
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

//===================================================================

export function buildBankNameError(
  value: string,
  options: OptionalFieldOptions = {}
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

//===================================================================

export function buildWorkingHoursError(
  value: string,
  options: OptionalFieldOptions = {}
): string {
  const workingHours = value.trim();

  if (!workingHours) {
    return options.required ? VALIDATION_MESSAGES.required.workingHours : '';
  }
  if (workingHours.length > WORKING_HOURS_MAX_LENGTH) {
    return VALIDATION_MESSAGES.limits.workingHoursMax;
  }
  if (!WORKING_HOURS_PATTERN.test(workingHours)) {
    return VALIDATION_MESSAGES.format.workingHours;
  }

  const validationIssue = getWorkingHoursValidationIssue(workingHours);
  if (validationIssue === 'missing-days') {
    return VALIDATION_MESSAGES.format.workingHoursMissingDays;
  }
  if (validationIssue === 'duplicate-days') {
    return VALIDATION_MESSAGES.format.workingHoursDuplicateDays;
  }
  if (validationIssue === 'range') {
    return VALIDATION_MESSAGES.format.workingHoursRange;
  }
  if (validationIssue === 'format') {
    return VALIDATION_MESSAGES.format.workingHours;
  }

  return '';
}

//===================================================================

export function buildTaxIdError(
  value: string,
  options: OptionalFieldOptions = {}
): string {
  const taxId = value.trim();

  if (!taxId) return options.required ? VALIDATION_MESSAGES.required.taxId : '';
  return TAX_ID_PATTERN.test(taxId) ? '' : VALIDATION_MESSAGES.format.taxId;
}

//===================================================================

export function buildIbanError(
  value: string,
  options: OptionalFieldOptions = {}
): string {
  const iban = value.trim().toUpperCase();

  if (!iban) return options.required ? VALIDATION_MESSAGES.required.iban : '';
  return IBAN_PATTERN.test(iban) ? '' : VALIDATION_MESSAGES.format.iban;
}

//===================================================================

export function buildPaymentPurposeError(
  value: string,
  options: OptionalFieldOptions = {}
): string {
  const paymentPurpose = value.trim();

  if (!paymentPurpose) {
    return options.required ? VALIDATION_MESSAGES.required.paymentPurpose : '';
  }
  if (paymentPurpose.length > PAYMENT_PURPOSE_MAX_LENGTH) {
    return VALIDATION_MESSAGES.limits.paymentPurposeMax;
  }
  if (!PAYMENT_PURPOSE_PATTERN.test(paymentPurpose)) {
    return VALIDATION_MESSAGES.format.paymentPurpose;
  }

  return '';
}
