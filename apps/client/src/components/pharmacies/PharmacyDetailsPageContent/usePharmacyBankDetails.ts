'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { PublicPaymentBankDetails } from '@e-pharmacy/types/pharmacies';

import { getPharmacyCheckoutDetails } from '@/lib/api/browser';

//===================================================================

export type PharmacyBankDetailsState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'success'; data: PublicPaymentBankDetails }>
  | Readonly<{ status: 'empty' }>
  | Readonly<{ status: 'error'; error: unknown }>;

//===================================================================

export function usePharmacyBankDetails(
  pharmacyId: string,
  initialBankDetails?: PublicPaymentBankDetails
) {
  const [state, setState] = useState<PharmacyBankDetailsState>(() =>
    initialBankDetails
      ? { status: 'success', data: initialBankDetails }
      : { status: 'idle' }
  );

  const stateRef = useRef(state);
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const updateState = useCallback((next: PharmacyBankDetailsState) => {
    stateRef.current = next;
    if (mountedRef.current) setState(next);
  }, []);

  const load = useCallback(
    async (options: Readonly<{ force?: boolean }> = {}) => {
      const current = stateRef.current;

      if (current.status === 'loading') return;

      if (
        !options.force &&
        (current.status === 'success' || current.status === 'empty')
      ) {
        return;
      }

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      updateState({ status: 'loading' });

      try {
        const data = await getPharmacyCheckoutDetails(pharmacyId, {
          signal: controller.signal,
        });

        if (controller.signal.aborted || !mountedRef.current) return;

        const bankDetails = data.pharmacy.bankDetails;
        updateState(
          bankDetails
            ? { status: 'success', data: bankDetails }
            : { status: 'empty' }
        );
      } catch (error) {
        if (controller.signal.aborted || !mountedRef.current) return;
        updateState({ status: 'error', error });
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      }
    },
    [pharmacyId, updateState]
  );

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;

    if (stateRef.current.status === 'loading') {
      updateState({ status: 'idle' });
    }
  }, [updateState]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  return {
    state,
    load,
    retry: () => load({ force: true }),
    cancel,
  } as const;
}
