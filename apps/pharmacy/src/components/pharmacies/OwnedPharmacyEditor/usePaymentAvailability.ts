'use client';

import { useEffect, useState } from 'react';

import {
  getOwnedPharmacyPaymentAvailability,
  type PharmacyPaymentDuplicates,
} from '@/lib/api/browser/owned-pharmacy-editor.api';

import type { PharmacyEditorValues } from './pharmacy-editor-fields';

//===================================================================

type Check = {
  key: string;
  duplicates: PharmacyPaymentDuplicates;
  unavailable: boolean;
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
  const key = JSON.stringify([pharmacyId, taxId, iban, receiptEmail]);
  const [checked, setChecked] = useState<Check | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    const timer = setTimeout(() => {
      void getOwnedPharmacyPaymentAvailability(
        pharmacyId,
        { taxId, iban, receiptEmail },
        controller.signal
      )
        .then((duplicates) => {
          if (!controller.signal.aborted)
            setChecked({ key, duplicates, unavailable: false });
        })

        .catch(() => {
          if (!controller.signal.aborted)
            setChecked({ key, duplicates: {}, unavailable: true });
        });
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, pharmacyId, taxId, iban, receiptEmail, key]);

  const waiting = enabled && checked?.key !== key;
  const errors: Partial<Record<'taxId' | 'iban' | 'receiptEmail', string>> = {};

  if (enabled && checked?.key === key) {
    for (const field of ['taxId', 'iban', 'receiptEmail'] as const) {
      if (checked.duplicates[field])
        errors[field] = 'This value is already used by another pharmacy.';
      else if (checked.unavailable && values[field].trim())
        errors[field] = 'Could not verify uniqueness. Try again.';
    }
  }

  return {
    errors,
    waiting,
    blocked: waiting || Object.keys(errors).length > 0,
  };
}
