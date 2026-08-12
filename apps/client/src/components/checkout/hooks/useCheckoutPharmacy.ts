import { useEffect, useState } from 'react';

import type { PharmacyCheckoutDetails } from '@e-pharmacy/types/pharmacies';

import { getPharmacyCheckoutDetails } from '@/lib/api/browser';
import type { CartPharmacyGroup } from '@/lib/cart/cart-groups';

//===================================================================

type CheckoutPharmacyStatus = 'idle' | 'loading' | 'success' | 'error';

//===================================================================

type CheckoutPharmacyResource = Readonly<{
  pharmacyId: string;
  status: 'success' | 'error';
  pharmacy: PharmacyCheckoutDetails | null;
  error: unknown | null;
}>;

//===================================================================

export function useCheckoutPharmacy(
  selectedOrderGroup: CartPharmacyGroup | null
) {
  const [resource, setResource] = useState<CheckoutPharmacyResource | null>(
    null
  );

  const pharmacyId = selectedOrderGroup?.pharmacyId ?? null;

  useEffect(() => {
    if (!pharmacyId) return;

    const controller = new AbortController();

    getPharmacyCheckoutDetails(pharmacyId, {
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) return;

        setResource({
          pharmacyId,
          status: 'success',
          pharmacy: response.pharmacy,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setResource({
          pharmacyId,
          status: 'error',
          pharmacy: null,
          error,
        });
      });

    return () => {
      controller.abort();
    };
  }, [pharmacyId]);

  const currentResource = resource?.pharmacyId === pharmacyId ? resource : null;

  const pharmacyStatus: CheckoutPharmacyStatus = !pharmacyId
    ? 'idle'
    : (currentResource?.status ?? 'loading');

  return {
    pharmacy: currentResource?.pharmacy ?? null,
    pharmacyStatus,
    pharmacyError: currentResource?.error ?? null,
    isPharmacyLoading: pharmacyStatus === 'loading',
  } as const;
}
