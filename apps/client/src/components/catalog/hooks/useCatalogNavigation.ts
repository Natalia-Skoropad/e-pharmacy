'use client';

import { useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';

//===================================================================

export function useCatalogNavigation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (href: string) => {
      if (isPending) return;

      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [isPending, router]
  );

  return { isPending, navigate } as const;
}
