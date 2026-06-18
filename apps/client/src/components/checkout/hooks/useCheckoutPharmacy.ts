import { useEffect, useState } from 'react';

import { getPharmacyCheckoutDetails } from '@/lib/api/browser';
import type { PharmacyCheckoutDetails } from '@e-pharmacy/types';
import type { CheckoutPharmacyOrderGroup } from '@/lib/checkout/checkout-types';

//===================================================================

export function useCheckoutPharmacy(
  selectedOrderGroup: CheckoutPharmacyOrderGroup | null
) {
  const [pharmacy, setPharmacy] = useState<PharmacyCheckoutDetails | null>(
    null
  );
  const [isPharmacyLoading, setIsPharmacyLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      if (!selectedOrderGroup) {
        setPharmacy(null);
        setIsPharmacyLoading(false);
        return;
      }

      try {
        setIsPharmacyLoading(true);
        const response = await getPharmacyCheckoutDetails(
          selectedOrderGroup.pharmacyId,
          {
            signal: controller.signal,
          }
        );

        setPharmacy(response.pharmacy);
      } catch {
        if (controller.signal.aborted) return;

        setPharmacy(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsPharmacyLoading(false);
        }
      }
    }, 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [selectedOrderGroup]);

  return {
    pharmacy,
    isPharmacyLoading,
  };
}
