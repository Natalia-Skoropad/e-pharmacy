export type OutsidePointerTarget = Readonly<{
  current: EventTarget | null;
}>;

//===================================================================

export type OutsidePointerSubscriptionOptions = Readonly<{
  target: Pick<Document, 'addEventListener' | 'removeEventListener'> | null;
  getRefs: () => readonly OutsidePointerTarget[];
  getIgnoredRefs: () => readonly OutsidePointerTarget[];
  onOutside: (event: PointerEvent) => void;
}>;

//===================================================================

function eventTouchesTarget(
  event: PointerEvent,
  target: EventTarget | null
): boolean {
  if (!target) return false;

  const path = event.composedPath();
  if (path.includes(target)) return true;

  return typeof Node !== 'undefined' &&
    target instanceof Node &&
    event.target instanceof Node
    ? target.contains(event.target)
    : false;
}

//===================================================================

export function subscribeOutsidePointerDown({
  target,
  getRefs,
  getIgnoredRefs,
  onOutside,
}: OutsidePointerSubscriptionOptions): () => void {
  if (!target) return () => undefined;

  const handlePointerDown = (event: Event) => {
    const pointerEvent = event as PointerEvent;

    if (
      getRefs().some((ref) => eventTouchesTarget(pointerEvent, ref.current)) ||
      getIgnoredRefs().some((ref) =>
        eventTouchesTarget(pointerEvent, ref.current)
      )
    ) {
      return;
    }

    onOutside(pointerEvent);
  };

  target.addEventListener('pointerdown', handlePointerDown);

  return () => {
    target.removeEventListener('pointerdown', handlePointerDown);
  };
}
