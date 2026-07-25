import type { MutableRefObject, RefObject } from 'react';

import {
  focusWithoutScroll,
  getFocusableElements,
  isFocusableElement,
} from './focusable-elements';

import {
  lockBodyScroll,
  resetBodyScrollLockForTests,
  unlockBodyScroll,
} from './body-scroll-lock';

//===================================================================

export type OverlayId = symbol;

type OverlayEntry = Readonly<{
  id: OverlayId;
  container: HTMLElement;
  onCloseRef: MutableRefObject<() => void>;
  closeOnEscapeRef: MutableRefObject<boolean>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  fallbackFocusRef?: RefObject<HTMLElement | null>;
  restoreFocus: boolean;
  previouslyFocusedElement: Element | null;
}>;

type BackgroundState = Readonly<{
  inert: boolean;
  ariaHidden: string | null;
}>;

//===================================================================

const overlayStack: OverlayEntry[] = [];
const backgroundStates = new Map<HTMLElement, BackgroundState>();
let isDocumentListenerAttached = false;
let backgroundObserver: MutationObserver | null = null;

//===================================================================

export function getTopOverlay(): OverlayEntry | undefined {
  return overlayStack[overlayStack.length - 1];
}

//===================================================================

export function isTopOverlay(id: OverlayId): boolean {
  return getTopOverlay()?.id === id;
}

//===================================================================

function getBodyChild(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element;

  while (current?.parentElement && current.parentElement !== document.body) {
    current = current.parentElement;
  }

  return current?.parentElement === document.body ? current : null;
}

//===================================================================

function restoreBackgroundIsolation(): void {
  for (const [element, state] of backgroundStates) {
    if (!element.isConnected) continue;

    element.inert = state.inert;

    if (state.ariaHidden === null) {
      element.removeAttribute('aria-hidden');
    } else {
      element.setAttribute('aria-hidden', state.ariaHidden);
    }
  }

  backgroundStates.clear();
}

//===================================================================

function updateBackgroundIsolation(): void {
  restoreBackgroundIsolation();

  const topOverlay = getTopOverlay();
  if (!topOverlay) return;

  const activeRoot = getBodyChild(topOverlay.container);

  for (const child of Array.from(document.body.children)) {
    if (!(child instanceof HTMLElement) || child === activeRoot) continue;
    if (child.matches('script, style')) continue;

    backgroundStates.set(child, {
      inert: child.inert,
      ariaHidden: child.getAttribute('aria-hidden'),
    });

    child.inert = true;
    child.setAttribute('aria-hidden', 'true');
  }
}

//===================================================================

function startBackgroundObserver(): void {
  if (backgroundObserver || typeof MutationObserver === 'undefined') return;

  backgroundObserver = new MutationObserver(() => {
    updateBackgroundIsolation();
  });

  backgroundObserver.observe(document.body, { childList: true });
}

//===================================================================

function stopBackgroundObserver(): void {
  backgroundObserver?.disconnect();
  backgroundObserver = null;
}

//===================================================================

function focusInitialTarget(entry: OverlayEntry): void {
  if (!isTopOverlay(entry.id)) return;

  if (focusWithoutScroll(entry.initialFocusRef?.current ?? null)) return;

  const firstFocusableElement = getFocusableElements(entry.container)[0];
  if (focusWithoutScroll(firstFocusableElement ?? null)) return;

  if (focusWithoutScroll(entry.fallbackFocusRef?.current ?? null)) return;

  entry.container.focus({ preventScroll: true });
}

//===================================================================

function restoreFocus(entry: OverlayEntry): void {
  if (!entry.restoreFocus) return;

  const previousElement = entry.previouslyFocusedElement;

  if (
    previousElement instanceof HTMLElement &&
    isFocusableElement(previousElement) &&
    focusWithoutScroll(previousElement)
  ) {
    return;
  }

  const underlyingOverlay = getTopOverlay();
  if (!underlyingOverlay) return;

  const fallback =
    getFocusableElements(underlyingOverlay.container)[0] ??
    underlyingOverlay.container;

  if (!focusWithoutScroll(fallback)) {
    underlyingOverlay.container.focus({ preventScroll: true });
  }
}

//===================================================================

function trapTab(event: KeyboardEvent, entry: OverlayEntry): void {
  const focusableElements = getFocusableElements(entry.container);

  if (focusableElements.length === 0) {
    event.preventDefault();
    entry.container.focus({ preventScroll: true });
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement;

  if (
    !(activeElement instanceof Node) ||
    !entry.container.contains(activeElement)
  ) {
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

function handleDocumentKeyDown(event: KeyboardEvent): void {
  const topOverlay = getTopOverlay();
  if (!topOverlay || event.defaultPrevented) return;

  if (event.key === 'Escape') {
    if (!topOverlay.closeOnEscapeRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    topOverlay.onCloseRef.current();
    return;
  }

  if (event.key === 'Tab') trapTab(event, topOverlay);
}

//===================================================================

function attachDocumentListener(): void {
  if (isDocumentListenerAttached) return;

  document.addEventListener('keydown', handleDocumentKeyDown);
  isDocumentListenerAttached = true;
}

//===================================================================

function detachDocumentListener(): void {
  if (!isDocumentListenerAttached || overlayStack.length > 0) return;

  document.removeEventListener('keydown', handleDocumentKeyDown);
  isDocumentListenerAttached = false;
}

//===================================================================

export function registerOverlay(entry: OverlayEntry): () => void {
  overlayStack.push(entry);
  lockBodyScroll();
  attachDocumentListener();
  startBackgroundObserver();
  updateBackgroundIsolation();

  const frameId = window.requestAnimationFrame(() => {
    focusInitialTarget(entry);
  });

  return () => {
    window.cancelAnimationFrame(frameId);

    const index = overlayStack.findIndex((overlay) => overlay.id === entry.id);
    if (index === -1) return;

    const wasTopOverlay = index === overlayStack.length - 1;
    overlayStack.splice(index, 1);
    unlockBodyScroll();

    if (overlayStack.length === 0) {
      stopBackgroundObserver();
      restoreBackgroundIsolation();
      detachDocumentListener();
    } else {
      updateBackgroundIsolation();
    }

    if (wasTopOverlay) restoreFocus(entry);
  };
}

//===================================================================

export function resetOverlayManagerForTests(): void {
  overlayStack.splice(0, overlayStack.length);
  stopBackgroundObserver();
  restoreBackgroundIsolation();
  resetBodyScrollLockForTests();

  if (isDocumentListenerAttached) {
    document.removeEventListener('keydown', handleDocumentKeyDown);
    isDocumentListenerAttached = false;
  }
}
