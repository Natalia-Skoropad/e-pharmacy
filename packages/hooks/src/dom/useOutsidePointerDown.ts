'use client';

import { useEffect, useRef, type RefObject } from 'react';

import { subscribeOutsidePointerDown } from './outside-pointer-subscription';

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
    if (!enabled) return;

    return subscribeOutsidePointerDown({
      target: typeof document === 'undefined' ? null : document,
      getRefs: () => refsRef.current,
      getIgnoredRefs: () => ignoredRefsRef.current,
      onOutside: (event) => onOutsideRef.current(event),
    });
  }, [enabled]);
}
