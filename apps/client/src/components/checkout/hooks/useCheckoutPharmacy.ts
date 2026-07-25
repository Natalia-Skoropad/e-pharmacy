import { useEffect, useState } from 'react';

import type { PharmacyCheckoutDetails } from '@e-pharmacy/types/pharmacies';

import { getPharmacyCheckoutDetails } from '@/lib/api/browser';
import type { CartPharmacyGroup } from '@/lib/cart/cart-groups';

//===================================================================

type CheckoutPharmacyState = Readonly<{
  pharmacyId: string;
  pharmacy: PharmacyCheckoutDetails | null;
}>;

//===================================================================

export function useCheckoutPharmacy(
  selectedOrderGroup: CartPharmacyGroup | null
) {
  const [pharmacyState, setPharmacyState] =
    useState<CheckoutPharmacyState | null>(null);

  const pharmacyId = selectedOrderGroup?.pharmacyId ?? null;

  useEffect(() => {
    if (!pharmacyId) return;

    const controller = new AbortController();

    getPharmacyCheckoutDetails(pharmacyId, {
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) return;

        setPharmacyState({
          pharmacyId,
          pharmacy: response.pharmacy,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;

        setPharmacyState({
          pharmacyId,
          pharmacy: null,
        });
      });

    return () => {
      controller.abort();
    };
  }, [pharmacyId]);

  const hasCurrentPharmacyState = pharmacyState?.pharmacyId === pharmacyId;

  return {
    pharmacy: hasCurrentPharmacyState ? pharmacyState.pharmacy : null,
    isPharmacyLoading: Boolean(pharmacyId) && !hasCurrentPharmacyState,
  };
}
