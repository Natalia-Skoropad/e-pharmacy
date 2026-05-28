import { useEffect, useState } from 'react';

import { getStoreDetails } from '@/services';
import type { Store } from '@/types';
import type { CheckoutStoreOrderGroup } from '@/types/checkout';

//===================================================================

export function useCheckoutStore(
  selectedOrderGroup: CheckoutStoreOrderGroup | null,
  token: string | null | undefined
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
        const response = await getStoreDetails(
          selectedOrderGroup.storeId,
          token ?? undefined
        );

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
  }, [selectedOrderGroup, token]);

  return {
    store,
    isStoreLoading,
  };
}
