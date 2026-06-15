import { useEffect, useState } from 'react';
import { getPharmacyDetails } from '@e-pharmacy/api-client/client';
import type { Pharmacy } from '@e-pharmacy/types';

import type { CheckoutPharmacyOrderGroup } from '@e-pharmacy/types/checkout';

//===================================================================

export function useCheckoutPharmacy(
  selectedOrderGroup: CheckoutPharmacyOrderGroup | null
) {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
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
        const response = await getPharmacyDetails(selectedOrderGroup.pharmacyId);

        if (!isMounted) return;

        setPharmacy(response.pharmacy);
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
