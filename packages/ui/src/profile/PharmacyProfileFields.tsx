'use client';
import {
  MarkdownTextarea,
  NameInput,
  TaxIdInput,
  IbanInput,
  EmailInput,
  CommentInput,
} from '../forms';

import {
  BANK_RECIPIENT_NAME_MAX_LENGTH,
  TAX_ID_MAX_LENGTH,
  IBAN_MAX_LENGTH,
  BANK_NAME_MAX_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  PAYMENT_PURPOSE_MAX_LENGTH,
  TEXT_EDITOR_MAX_LENGTH,
  normalizeEmail,
  normalizeIban,
  sanitizeTaxId,
  type PharmacyPaymentFormValues,
} from '@e-pharmacy/validation/pharmacy';

import css from './PharmacyProfileFields.module.css';

//===================================================================

export function PharmacyAboutFields({
  value,
  disabled,
  error,
  isTouched,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  error?: string;
  isTouched?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <MarkdownTextarea
      id="pharmacy-description"
      name="pharmacyDescription"
      expanded
      label="Description"
      value={value}
      placeholder="Describe pharmacy services, pickup details, and useful information for clients."
      hint="You can use simple formatting buttons or type plain text."
      error={error}
      isTouched={isTouched}
      maxLength={TEXT_EDITOR_MAX_LENGTH}
      disabled={disabled}
      onValueChange={onChange ?? (() => undefined)}
    />
  );
}

//===================================================================

export function PharmacyPaymentFields({
  values,
  errors = {},
  touched = {},
  disabled = false,
  onChange,
}: {
  values: PharmacyPaymentFormValues;
  errors?: Partial<Record<keyof PharmacyPaymentFormValues, string>>;
  touched?: Partial<Record<keyof PharmacyPaymentFormValues, boolean>>;
  disabled?: boolean;
  onChange?: (field: keyof PharmacyPaymentFormValues, value: string) => void;
}) {
  const update = onChange ?? (() => undefined);

  return (
    <div className={css.groups}>
      <div className={css.group}>
        <div className={css.grid}>
          <NameInput
            id="recipient-name"
            name="recipientName"
            label="Recipient name"
            hint="Enter the legal payment recipient name."
            value={values.recipientName}
            error={errors.recipientName}
            isTouched={Boolean(touched.recipientName)}
            disabled={disabled}
            maxLength={BANK_RECIPIENT_NAME_MAX_LENGTH}
            onChange={(event) => update('recipientName', event.target.value)}
          />

          <TaxIdInput
            id="tax-id"
            name="taxId"
            value={values.taxId}
            error={errors.taxId}
            isTouched={Boolean(touched.taxId)}
            disabled={disabled}
            maxLength={TAX_ID_MAX_LENGTH}
            onChange={(event) =>
              update('taxId', sanitizeTaxId(event.target.value))
            }
          />
        </div>
      </div>

      <div className={css.group}>
        <div className={css.grid}>
          <IbanInput
            id="iban"
            name="iban"
            className={css.wide}
            value={values.iban}
            error={errors.iban}
            isTouched={Boolean(touched.iban)}
            disabled={disabled}
            maxLength={IBAN_MAX_LENGTH}
            onChange={(event) =>
              update('iban', normalizeIban(event.target.value))
            }
          />

          <NameInput
            id="bank-name"
            name="bankName"
            label="Bank name"
            value={values.bankName}
            error={errors.bankName}
            isTouched={Boolean(touched.bankName)}
            disabled={disabled}
            maxLength={BANK_NAME_MAX_LENGTH}
            onChange={(event) => update('bankName', event.target.value)}
          />

          <EmailInput
            id="receipt-email"
            name="receiptEmail"
            label="Receipt email"
            value={values.receiptEmail}
            error={errors.receiptEmail}
            isTouched={Boolean(touched.receiptEmail)}
            disabled={disabled}
            maxLength={USER_EMAIL_MAX_LENGTH}
            onChange={(event) =>
              update('receiptEmail', normalizeEmail(event.target.value))
            }
          />
        </div>
      </div>

      <div className={css.group}>
        <div className={css.grid}>
          <CommentInput
            id="payment-purpose"
            name="paymentPurpose"
            label="Payment purpose"
            className={css.wide}
            value={values.paymentPurpose}
            error={errors.paymentPurpose}
            isTouched={Boolean(touched.paymentPurpose)}
            required
            disabled={disabled}
            maxLength={PAYMENT_PURPOSE_MAX_LENGTH}
            onChange={(event) => update('paymentPurpose', event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
