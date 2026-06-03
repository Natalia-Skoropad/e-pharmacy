export const LISTBOX_OPEN_KEYS = ['ArrowDown', 'ArrowUp'] as const;
export const LISTBOX_SELECT_KEYS = ['Enter', ' '] as const;

//===================================================================

export function isListboxOpenKey(key: string) {
  return LISTBOX_OPEN_KEYS.includes(key as (typeof LISTBOX_OPEN_KEYS)[number]);
}

export function isListboxSelectKey(key: string) {
  return LISTBOX_SELECT_KEYS.includes(
    key as (typeof LISTBOX_SELECT_KEYS)[number]
  );
}

//===================================================================

export function getNextLoopedIndex({
  currentIndex,
  direction,
  itemsCount,
}: {
  currentIndex: number;
  direction: 1 | -1;
  itemsCount: number;
}) {
  if (itemsCount <= 0) return 0;

  const nextIndex = currentIndex + direction;

  if (nextIndex < 0) return itemsCount - 1;
  if (nextIndex >= itemsCount) return 0;

  return nextIndex;
}

//===================================================================

export function getBoundedIndex(index: number, itemsCount: number) {
  if (itemsCount <= 0) return 0;

  return Math.min(Math.max(index, 0), itemsCount - 1);
}
