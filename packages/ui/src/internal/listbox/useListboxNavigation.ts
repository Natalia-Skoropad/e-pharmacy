'use client';

import { useCallback, useEffect, useState } from 'react';

//===================================================================

function findEnabledIndex(
  itemsCount: number,
  isDisabled: (index: number) => boolean,
  preferredIndex: number,
  direction: 1 | -1
): number {
  if (itemsCount <= 0) return -1;

  for (let offset = 0; offset < itemsCount; offset += 1) {
    const index =
      (preferredIndex + offset * direction + itemsCount * 2) % itemsCount;
    if (!isDisabled(index)) return index;
  }

  return -1;
}

//===================================================================

export function useListboxNavigation(
  itemsCount: number,
  initialIndex = 0,
  isDisabled: (index: number) => boolean = () => false
) {
  const [activeIndex, setActiveIndex] = useState(() =>
    findEnabledIndex(itemsCount, isDisabled, initialIndex, 1)
  );

  useEffect(() => {
    setActiveIndex((current) => {
      if (current >= 0 && current < itemsCount && !isDisabled(current)) {
        return current;
      }

      return findEnabledIndex(itemsCount, isDisabled, 0, 1);
    });
  }, [isDisabled, itemsCount]);

  const resetActiveIndex = useCallback(
    (nextIndex = 0) => {
      setActiveIndex(findEnabledIndex(itemsCount, isDisabled, nextIndex, 1));
    },
    [isDisabled, itemsCount]
  );

  const moveActiveIndex = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((currentIndex) => {
        const start =
          currentIndex < 0
            ? direction === 1
              ? 0
              : itemsCount - 1
            : currentIndex + direction;
        return findEnabledIndex(itemsCount, isDisabled, start, direction);
      });
    },
    [isDisabled, itemsCount]
  );

  const moveToStart = useCallback(() => {
    setActiveIndex(findEnabledIndex(itemsCount, isDisabled, 0, 1));
  }, [isDisabled, itemsCount]);

  const moveToEnd = useCallback(() => {
    setActiveIndex(
      findEnabledIndex(itemsCount, isDisabled, itemsCount - 1, -1)
    );
  }, [isDisabled, itemsCount]);

  return {
    activeIndex,
    moveActiveIndex,
    moveToStart,
    moveToEnd,
    resetActiveIndex,
    setActiveIndex,
  };
}
