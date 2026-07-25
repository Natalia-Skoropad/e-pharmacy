'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { isTopOverlay, type OverlayId } from './overlay-manager';

//===================================================================

export type UseBackdropPointerParams = Readonly<{
  overlayId: OverlayId;
  enabled?: boolean;
  onClose: () => void;
}>;

//===================================================================

export function useBackdropPointer({
  overlayId,
  enabled = true,
  onClose,
}: UseBackdropPointerParams) {
  const onCloseRef = useRef(onClose);
  const activePointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || !isTopOverlay(overlayId)) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      activePointerIdRef.current =
        event.target === event.currentTarget ? event.pointerId : null;
    },
    [enabled, overlayId]
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const shouldClose =
        enabled &&
        isTopOverlay(overlayId) &&
        activePointerIdRef.current === event.pointerId &&
        event.target === event.currentTarget;

      activePointerIdRef.current = null;
      if (shouldClose) onCloseRef.current();
    },
    [enabled, overlayId]
  );

  const onPointerCancel = useCallback(() => {
    activePointerIdRef.current = null;
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
}
