'use client';

import { useEffect, useRef, type RefObject } from 'react';

//===================================================================

type AllowedTarget = RefObject<EventTarget | null>;

//===================================================================

export type UseOutsidePointerDownParams = Readonly<{
  refs: readonly AllowedTarget[];
  ignoredRefs?: readonly AllowedTarget[];
  enabled?: boolean;
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

  return target instanceof Node && event.target instanceof Node
    ? target.contains(event.target)
    : false;
}

//===================================================================

export function useOutsidePointerDown({
  refs,
  ignoredRefs = [],
  enabled = true,
  onOutside,
}: UseOutsidePointerDownParams): void {
  const refsRef = useRef(refs);
  const ignoredRefsRef = useRef(ignoredRefs);
  const onOutsideRef = useRef(onOutside);

  useEffect(() => {
    refsRef.current = refs;
  }, [refs]);

  useEffect(() => {
    ignoredRefsRef.current = ignoredRefs;
  }, [ignoredRefs]);

  useEffect(() => {
    onOutsideRef.current = onOutside;
  }, [onOutside]);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        refsRef.current.some((ref) => eventTouchesTarget(event, ref.current)) ||
        ignoredRefsRef.current.some((ref) =>
          eventTouchesTarget(event, ref.current)
        )
      ) {
        return;
      }

      onOutsideRef.current(event);
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [enabled]);
}
