'use client';

import { useEffect, useState } from 'react';

import {
  getOwnedPharmacyPaymentAvailability,
  type PharmacyAvailabilityResult,
  type PharmacyPaymentMatches,
  type PharmacyUniqueField,
} from '@/lib/api/browser/owned-pharmacy-editor.api';

import type { PharmacyEditorValues } from './pharmacy-editor-fields';

//===================================================================

type Check = {
  key: string;
  result: PharmacyAvailabilityResult;
  unavailable: boolean;
};

//===================================================================

const FIELD_WARNING_MESSAGES: Record<PharmacyUniqueField, string> = {
  phone: 'This phone is also used in another of your pharmacies.',
  email: 'This email is also used in another of your pharmacies.',
  taxId: 'This Tax ID / EDRPOU is also used in another of your pharmacies.',
  iban: 'This IBAN is also used in another of your pharmacies.',

  receiptEmail:
    'This receipt email is also used in another of your pharmacies.',
};

//===================================================================

export function usePaymentAvailability(
  pharmacyId: string | undefined,
  values: PharmacyEditorValues,
  enabled: boolean
) {
  const taxId = values.taxId.trim();
  const iban = values.iban.trim().toUpperCase();
  const receiptEmail = values.receiptEmail.trim().toLowerCase();
  const phone = values.phone.trim();
  const email = values.email.trim().toLowerCase();

  const key = JSON.stringify([
    pharmacyId,
    taxId,
    iban,
    receiptEmail,
    phone,
    email,
  ]);

  const [checked, setChecked] = useState<Check | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    const timer = setTimeout(() => {
      void getOwnedPharmacyPaymentAvailability(
        pharmacyId,
        { taxId, iban, receiptEmail, phone, email },
        controller.signal
      )
        .then((result) => {
          if (!controller.signal.aborted)
            setChecked({ key, result, unavailable: false });
        })

        .catch(() => {
          if (!controller.signal.aborted)
            setChecked({
              key,
              result: { duplicates: {}, matches: {} },
              unavailable: true,
            });
        });
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, pharmacyId, taxId, iban, receiptEmail, phone, email, key]);

  const waiting = enabled && checked?.key !== key;
  const errors: Partial<Record<PharmacyUniqueField, string>> = {};
  const warnings: Partial<Record<PharmacyUniqueField, string>> = {};

  const matches: PharmacyPaymentMatches =
    enabled && checked?.key === key ? checked.result.matches : {};

  if (enabled && checked?.key === key) {
    for (const field of [
      'taxId',
      'iban',
      'receiptEmail',
      'phone',
      'email',
    ] as const) {
      if (checked.result.duplicates[field])
        errors[field] = 'This value is already used by another pharmacy owner.';
      else if (checked.unavailable && values[field].trim())
        errors[field] = 'Could not verify uniqueness. Try again.';
    }
  }

  for (const field of [
    'taxId',
    'iban',
    'receiptEmail',
    'phone',
    'email',
  ] as const) {
    if (!errors[field] && matches[field]?.length)
      warnings[field] = FIELD_WARNING_MESSAGES[field];
  }

  return {
    errors,
    warnings,
    matches,
    waiting,
    blocked: waiting || Object.keys(errors).length > 0,
  };
}
