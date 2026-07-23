'use client';

import { useEffect, useRef, type RefObject } from 'react';

//===================================================================

type OverlayEntry = {
  id: symbol;
  container: HTMLElement;
  onCloseRef: { current: () => void };
  closeOnEscapeRef: { current: boolean };
  restoreFocus: boolean;
  previouslyFocusedElement: Element | null;
};

//===================================================================

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

//===================================================================

const overlayStack: OverlayEntry[] = [];
let originalBodyOverflow = '';
let isDocumentListenerAttached = false;

//===================================================================

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.offsetParent !== null
  );
}

//===================================================================

function getTopOverlay(): OverlayEntry | undefined {
  return overlayStack[overlayStack.length - 1];
}

//===================================================================

function handleDocumentKeyDown(event: KeyboardEvent): void {
  const topOverlay = getTopOverlay();
  if (!topOverlay) return;

  if (event.key === 'Escape') {
    event.stopPropagation();

    if (topOverlay.closeOnEscapeRef.current) {
      event.preventDefault();
      topOverlay.onCloseRef.current();
    }

    return;
  }

  if (event.key !== 'Tab') return;

  const focusableElements = getFocusableElements(topOverlay.container);

  if (focusableElements.length === 0) {
    event.preventDefault();
    topOverlay.container.focus({ preventScroll: true });
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement;

  if (!topOverlay.container.contains(activeElement)) {
    event.preventDefault();
    firstElement.focus({ preventScroll: true });
    return;
  }

  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus({ preventScroll: true });
    return;
  }

  if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus({ preventScroll: true });
  }
}

//===================================================================

function attachDocumentListener(): void {
  if (isDocumentListenerAttached) return;
  document.addEventListener('keydown', handleDocumentKeyDown, true);
  isDocumentListenerAttached = true;
}

//===================================================================

function detachDocumentListener(): void {
  if (!isDocumentListenerAttached || overlayStack.length > 0) return;
  document.removeEventListener('keydown', handleDocumentKeyDown, true);
  isDocumentListenerAttached = false;
}

//===================================================================

function registerOverlay(entry: OverlayEntry): () => void {
  if (overlayStack.length === 0) {
    originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  overlayStack.push(entry);
  attachDocumentListener();

  window.requestAnimationFrame(() => {
    if (getTopOverlay()?.id !== entry.id) return;
    const firstFocusableElement =
      getFocusableElements(entry.container)[0] ?? entry.container;
    firstFocusableElement.focus({ preventScroll: true });
  });

  return () => {
    const index = overlayStack.findIndex((overlay) => overlay.id === entry.id);
    if (index === -1) return;

    const wasTopOverlay = index === overlayStack.length - 1;
    overlayStack.splice(index, 1);

    if (overlayStack.length === 0) {
      document.body.style.overflow = originalBodyOverflow;
      detachDocumentListener();
    }

    if (
      wasTopOverlay &&
      entry.restoreFocus &&
      entry.previouslyFocusedElement instanceof HTMLElement &&
      document.contains(entry.previouslyFocusedElement)
    ) {
      entry.previouslyFocusedElement.focus({ preventScroll: true });
    }
  };
}

//===================================================================

export type UseOverlayLayerParams<TContainer extends HTMLElement> = Readonly<{
  isOpen: boolean;
  containerRef: RefObject<TContainer | null>;
  onClose: () => void;
  closeOnEscape?: boolean;
  restoreFocus?: boolean;
}>;

//===================================================================

export function useOverlayLayer<TContainer extends HTMLElement>({
  isOpen,
  containerRef,
  onClose,
  closeOnEscape = true,
  restoreFocus = true,
}: UseOverlayLayerParams<TContainer>): void {
  const onCloseRef = useRef(onClose);
  const closeOnEscapeRef = useRef(closeOnEscape);

  onCloseRef.current = onClose;
  closeOnEscapeRef.current = closeOnEscape;

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    return registerOverlay({
      id: Symbol('overlay'),
      container: containerRef.current,
      onCloseRef,
      closeOnEscapeRef,
      restoreFocus,
      previouslyFocusedElement: document.activeElement,
    });
  }, [containerRef, isOpen, restoreFocus]);
}
