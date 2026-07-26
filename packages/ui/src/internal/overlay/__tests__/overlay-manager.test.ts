import assert from 'node:assert/strict';
import test, { afterEach, before } from 'node:test';

import {
  createFocusable,
  dispatchBubblingKeyboardEvent,
  fakeDocument,
  flushAnimationFrames,
  getPendingAnimationFrameCount,
  installFakeDom,
  resetFakeDom,
  FakeElement,
  FakeKeyboardEvent,
} from './fake-dom.ts';

//===================================================================

before(() => {
  installFakeDom();
});

const manager = await import('../overlay-manager.ts');

//===================================================================

afterEach(() => {
  manager.resetOverlayManagerForTests();
  resetFakeDom();
});

//===================================================================

function createOverlay() {
  const portal = new FakeElement('div');
  const container = new FakeElement('dialog');
  container.tabIndex = -1;
  portal.appendChild(container);
  fakeDocument.body.appendChild(portal);

  return { portal, container };
}

//===================================================================

test('inner widgets own Escape when they prevent the event', () => {
  const { container } = createOverlay();
  const innerSelect = new FakeElement('div');
  container.appendChild(innerSelect);
  let closes = 0;
  let selectCloses = 0;

  innerSelect.addEventListener('keydown', (event) => {
    const keyboardEvent = event as FakeKeyboardEvent;
    if (keyboardEvent.key !== 'Escape') return;

    selectCloses += 1;
    keyboardEvent.preventDefault();
  });

  const cleanup = manager.registerOverlay({
    id: Symbol('modal'),
    container: container as unknown as HTMLElement,
    onCloseRef: { current: () => closes += 1 },
    closeOnEscapeRef: { current: true },
    restoreFocus: true,
    previouslyFocusedElement: fakeDocument.body as unknown as Element,
  });

  const event = new FakeKeyboardEvent('Escape');
  dispatchBubblingKeyboardEvent(innerSelect, event);

  assert.equal(selectCloses, 1);
  assert.equal(event.defaultPrevented, true);
  assert.equal(closes, 0);
  cleanup();
});

//===================================================================

test('closeOnEscape=false does not block child keyboard behavior', () => {
  const { container } = createOverlay();
  let closes = 0;

  const cleanup = manager.registerOverlay({
    id: Symbol('drawer'),
    container: container as unknown as HTMLElement,
    onCloseRef: { current: () => closes += 1 },
    closeOnEscapeRef: { current: false },
    restoreFocus: true,
    previouslyFocusedElement: fakeDocument.body as unknown as Element,
  });

  const event = new FakeKeyboardEvent('Escape');
  fakeDocument.dispatchEvent(event);

  assert.equal(closes, 0);
  assert.equal(event.defaultPrevented, false);
  assert.equal(event.propagationStopped, false);
  cleanup();
});

//===================================================================

test('nested overlays close only the top layer', () => {
  const first = createOverlay();
  const second = createOverlay();
  let firstCloses = 0;
  let secondCloses = 0;

  const cleanupFirst = manager.registerOverlay({
    id: Symbol('first'),
    container: first.container as unknown as HTMLElement,
    onCloseRef: { current: () => firstCloses += 1 },
    closeOnEscapeRef: { current: true },
    restoreFocus: true,
    previouslyFocusedElement: fakeDocument.body as unknown as Element,
  });

  const cleanupSecond = manager.registerOverlay({
    id: Symbol('second'),
    container: second.container as unknown as HTMLElement,
    onCloseRef: { current: () => secondCloses += 1 },
    closeOnEscapeRef: { current: true },
    restoreFocus: true,
    previouslyFocusedElement: first.container as unknown as Element,
  });

  fakeDocument.dispatchEvent(new FakeKeyboardEvent('Escape'));

  assert.equal(firstCloses, 0);
  assert.equal(secondCloses, 1);

  cleanupSecond();
  cleanupFirst();
});

//===================================================================

test('uses explicit initial focus and restores focus to the opener', () => {
  const opener = createFocusable();
  fakeDocument.body.appendChild(opener);
  opener.focus();

  const { container } = createOverlay();
  const cancelButton = createFocusable();
  const deleteButton = createFocusable();
  container.appendChild(cancelButton);
  container.appendChild(deleteButton);

  const cleanup = manager.registerOverlay({
    id: Symbol('confirmation'),
    container: container as unknown as HTMLElement,
    onCloseRef: { current: () => undefined },
    closeOnEscapeRef: { current: true },
    initialFocusRef: { current: cancelButton as unknown as HTMLElement },
    restoreFocus: true,
    previouslyFocusedElement: opener as unknown as Element,
  });

  flushAnimationFrames();
  assert.equal(fakeDocument.activeElement, cancelButton);

  cleanup();
  assert.equal(fakeDocument.activeElement, opener);
});

//===================================================================

test('traps Tab in both directions and focuses the container when empty', () => {
  const { container } = createOverlay();
  const first = createFocusable();
  const last = createFocusable();
  container.appendChild(first);
  container.appendChild(last);

  const cleanup = manager.registerOverlay({
    id: Symbol('focus-trap'),
    container: container as unknown as HTMLElement,
    onCloseRef: { current: () => undefined },
    closeOnEscapeRef: { current: true },
    restoreFocus: false,
    previouslyFocusedElement: fakeDocument.body as unknown as Element,
  });

  flushAnimationFrames();
  last.focus();
  fakeDocument.dispatchEvent(new FakeKeyboardEvent('Tab'));
  assert.equal(fakeDocument.activeElement, first);

  first.focus();
  fakeDocument.dispatchEvent(new FakeKeyboardEvent('Tab', { shiftKey: true }));
  assert.equal(fakeDocument.activeElement, last);
  cleanup();

  const empty = createOverlay();
  const cleanupEmpty = manager.registerOverlay({
    id: Symbol('empty'),
    container: empty.container as unknown as HTMLElement,
    onCloseRef: { current: () => undefined },
    closeOnEscapeRef: { current: true },
    restoreFocus: false,
    previouslyFocusedElement: fakeDocument.body as unknown as Element,
  });

  flushAnimationFrames();
  fakeDocument.dispatchEvent(new FakeKeyboardEvent('Tab'));
  assert.equal(fakeDocument.activeElement, empty.container);
  cleanupEmpty();
});

//===================================================================

test('scroll locking and background inertness remain stack-safe', () => {
  const background = new FakeElement('main');
  fakeDocument.body.appendChild(background);
  fakeDocument.body.computedPaddingRight = '4px';

  const first = createOverlay();
  const second = createOverlay();

  const cleanupFirst = manager.registerOverlay({
    id: Symbol('first'),
    container: first.container as unknown as HTMLElement,
    onCloseRef: { current: () => undefined },
    closeOnEscapeRef: { current: true },
    restoreFocus: false,
    previouslyFocusedElement: fakeDocument.body as unknown as Element,
  });

  assert.equal(fakeDocument.body.style.overflow, 'hidden');
  assert.equal(fakeDocument.body.style.paddingRight, '24px');
  assert.equal(background.inert, true);
  assert.equal(background.getAttribute('aria-hidden'), 'true');

  const cleanupSecond = manager.registerOverlay({
    id: Symbol('second'),
    container: second.container as unknown as HTMLElement,
    onCloseRef: { current: () => undefined },
    closeOnEscapeRef: { current: true },
    restoreFocus: false,
    previouslyFocusedElement: first.container as unknown as Element,
  });

  cleanupFirst();
  assert.equal(fakeDocument.body.style.overflow, 'hidden');

  cleanupSecond();
  assert.equal(fakeDocument.body.style.overflow, '');
  assert.equal(fakeDocument.body.style.paddingRight, '');
  assert.equal(background.inert, false);
  assert.equal(background.getAttribute('aria-hidden'), null);
});

//===================================================================

test('unmount cancels queued initial focus work', () => {
  const { container } = createOverlay();
  const focusable = createFocusable();
  container.appendChild(focusable);

  const cleanup = manager.registerOverlay({
    id: Symbol('raf'),
    container: container as unknown as HTMLElement,
    onCloseRef: { current: () => undefined },
    closeOnEscapeRef: { current: true },
    restoreFocus: false,
    previouslyFocusedElement: fakeDocument.body as unknown as Element,
  });

  assert.equal(getPendingAnimationFrameCount(), 1);
  cleanup();
  assert.equal(getPendingAnimationFrameCount(), 0);
  flushAnimationFrames();
  assert.notEqual(fakeDocument.activeElement, focusable);
});

//===================================================================

test('restores focus to the underlying overlay when the opener was removed', () => {
  const underlying = createOverlay();
  const removedOpener = createFocusable();
  const underlyingFallback = createFocusable();
  underlying.container.appendChild(removedOpener);
  underlying.container.appendChild(underlyingFallback);

  const cleanupUnderlying = manager.registerOverlay({
    id: Symbol('underlying'),
    container: underlying.container as unknown as HTMLElement,
    onCloseRef: { current: () => undefined },
    closeOnEscapeRef: { current: true },
    restoreFocus: false,
    previouslyFocusedElement: fakeDocument.body as unknown as Element,
  });

  flushAnimationFrames();
  removedOpener.focus();

  const top = createOverlay();
  const topControl = createFocusable();
  top.container.appendChild(topControl);

  const cleanupTop = manager.registerOverlay({
    id: Symbol('top'),
    container: top.container as unknown as HTMLElement,
    onCloseRef: { current: () => undefined },
    closeOnEscapeRef: { current: true },
    restoreFocus: true,
    previouslyFocusedElement: removedOpener as unknown as Element,
  });

  flushAnimationFrames();
  underlying.container.removeChild(removedOpener);
  cleanupTop();

  assert.equal(fakeDocument.activeElement, underlyingFallback);
  cleanupUnderlying();
});
