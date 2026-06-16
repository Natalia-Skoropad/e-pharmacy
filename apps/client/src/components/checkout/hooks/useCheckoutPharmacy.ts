import { useEffect, useState } from 'react';

import {
  getPharmacyCheckoutDetails,
  getPharmacyDetails,
} from '@e-pharmacy/api-client/client';

import type { Pharmacy, PharmacyCheckoutDetails } from '@e-pharmacy/types';

import type { CheckoutPharmacyOrderGroup } from '@/lib/checkout/checkout-types';

//===================================================================

export function useCheckoutPharmacy(
  selectedOrderGroup: CheckoutPharmacyOrderGroup | null
) {
  const [pharmacy, setPharmacy] = useState<
    (Pharmacy & PharmacyCheckoutDetails) | null
  >(null);
  const [isPharmacyLoading, setIsPharmacyLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchPharmacy() {
      if (!selectedOrderGroup) {
        setPharmacy(null);
        setIsPharmacyLoading(false);
        return;
      }

      try {
        setIsPharmacyLoading(true);
        const [detailsResponse, checkoutResponse] = await Promise.all([
          getPharmacyDetails(selectedOrderGroup.pharmacyId),
          getPharmacyCheckoutDetails(selectedOrderGroup.pharmacyId),
        ]);

        if (!isMounted) return;

        setPharmacy({
          ...detailsResponse.pharmacy,
          ...checkoutResponse.pharmacy,
        });
      } catch {
        if (!isMounted) return;

        setPharmacy(null);
      } finally {
        if (!isMounted) return;

        setIsPharmacyLoading(false);
      }
    }

    void fetchPharmacy();

    return () => {
      isMounted = false;
    };
  }, [selectedOrderGroup]);

  return {
    pharmacy,
    isPharmacyLoading,
  };
}
