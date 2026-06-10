import { useEffect, useState } from 'react';
import { getStoreDetails } from '@e-pharmacy/api-client/client';
import type { Store } from '@e-pharmacy/types';

import type { CheckoutStoreOrderGroup } from '@e-pharmacy/types/checkout';

//===================================================================

export function useCheckoutStore(
  selectedOrderGroup: CheckoutStoreOrderGroup | null
) {
  const [store, setStore] = useState<Store | null>(null);
  const [isStoreLoading, setIsStoreLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchStore() {
      if (!selectedOrderGroup) {
        setStore(null);
        setIsStoreLoading(false);
        return;
      }

      try {
        setIsStoreLoading(true);
        const response = await getStoreDetails(selectedOrderGroup.storeId);

        if (!isMounted) return;

        setStore(response.store);
      } catch {
        if (!isMounted) return;

        setStore(null);
      } finally {
        if (!isMounted) return;

        setIsStoreLoading(false);
      }
    }

    void fetchStore();

    return () => {
      isMounted = false;
    };
  }, [selectedOrderGroup]);

  return {
    store,
    isStoreLoading,
  };
}
