'use client';

import { useEffect, useState } from 'react';

//===================================================================

export function useNavigationGroupDisclosure(activePath?: string) {
  const [manuallyExpanded, setManuallyExpanded] = useState<ReadonlySet<number>>(
    () => new Set<number>()
  );

  const [collapsedActive, setCollapsedActive] = useState<ReadonlySet<number>>(
    () => new Set<number>()
  );

  useEffect(() => {
    setCollapsedActive(new Set<number>());
  }, [activePath]);

  const isExpanded = (index: number, isActive: boolean) =>
    manuallyExpanded.has(index) || (isActive && !collapsedActive.has(index));

  const toggle = (index: number, isActive: boolean) => {
    const currentlyExpanded = isExpanded(index, isActive);

    setManuallyExpanded((current) => {
      const next = new Set(current);
      if (currentlyExpanded) next.delete(index);
      else next.add(index);
      return next;
    });

    setCollapsedActive((current) => {
      const next = new Set(current);

      if (isActive && currentlyExpanded) next.add(index);
      else next.delete(index);

      return next;
    });
  };

  return { isExpanded, toggle } as const;
}
