'use client';

import { useCallback, useState } from 'react';

import { getBoundedIndex, getNextLoopedIndex } from './listbox-keyboard';

//===================================================================

export function useListboxNavigation(itemsCount: number, initialIndex = 0) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const boundedActiveIndex = getBoundedIndex(activeIndex, itemsCount);

  const resetActiveIndex = useCallback((nextIndex = 0) => {
    setActiveIndex(nextIndex);
  }, []);

  const moveActiveIndex = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((currentIndex: number) =>
        getNextLoopedIndex({
          currentIndex,
          direction,
          itemsCount,
        })
      );
    },
    [itemsCount]
  );

  return {
    activeIndex: boundedActiveIndex,
    moveActiveIndex,
    resetActiveIndex,
    setActiveIndex,
  };
}
