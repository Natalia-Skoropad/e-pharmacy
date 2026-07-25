'use client';

import { useEffect, useRef, type RefObject } from 'react';

import {
  registerOverlay,
  type OverlayId,
} from './overlay-manager';

//===================================================================

export type UseOverlayLayerParams<TContainer extends HTMLElement> = Readonly<{
  id: OverlayId;
  isOpen: boolean;
  containerRef: RefObject<TContainer | null>;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  fallbackFocusRef?: RefObject<HTMLElement | null>;
  closeOnEscape?: boolean;
  restoreFocus?: boolean;
}>;

//===================================================================

export function useOverlayLayer<TContainer extends HTMLElement>({
  id,
  isOpen,
  containerRef,
  onClose,
  initialFocusRef,
  fallbackFocusRef,
  closeOnEscape = true,
  restoreFocus = true,
}: UseOverlayLayerParams<TContainer>): void {
  const onCloseRef = useRef(onClose);
  const closeOnEscapeRef = useRef(closeOnEscape);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    closeOnEscapeRef.current = closeOnEscape;
  }, [closeOnEscape]);

  useEffect(() => {
    const container = containerRef.current;
    if (!isOpen || !container) return;

    return registerOverlay({
      id,
      container,
      onCloseRef,
      closeOnEscapeRef,
      initialFocusRef,
      fallbackFocusRef,
      restoreFocus,
      previouslyFocusedElement: document.activeElement,
    });
  }, [
    containerRef,
    fallbackFocusRef,
    id,
    initialFocusRef,
    isOpen,
    restoreFocus,
  ]);
}
