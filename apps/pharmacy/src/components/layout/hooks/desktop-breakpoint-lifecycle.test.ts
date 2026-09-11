import assert from 'node:assert/strict';
import test from 'node:test';

import {
  subscribeToDesktopBreakpoint,
  type DesktopBreakpointChangeEvent,
} from './desktop-breakpoint-lifecycle';

//===================================================================

function createMediaQuery(initialMatches: boolean) {
  let listener: ((event: DesktopBreakpointChangeEvent) => void) | null = null;
  let removedListener: ((event: DesktopBreakpointChangeEvent) => void) | null =
    null;

  return {
    mediaQuery: {
      matches: initialMatches,

      addEventListener(
        _type: 'change',
        nextListener: (event: DesktopBreakpointChangeEvent) => void
      ) {
        listener = nextListener;
      },

      removeEventListener(
        _type: 'change',
        nextListener: (event: DesktopBreakpointChangeEvent) => void
      ) {
        removedListener = nextListener;
      },
    },

    emit(matches: boolean) {
      listener?.({ matches });
    },

    wasCleanedUp() {
      return listener !== null && removedListener === listener;
    },
  };
}

//===================================================================

test('an already-open mobile menu is closed when mounted at desktop width', () => {
  const fixture = createMediaQuery(true);
  let closeCount = 0;

  subscribeToDesktopBreakpoint(fixture.mediaQuery, () => {
    closeCount += 1;
  });

  assert.equal(closeCount, 1);
});

//===================================================================

test('crossing from mobile to desktop closes once and returning mobile does not open', () => {
  const fixture = createMediaQuery(false);
  let closeCount = 0;

  const cleanup = subscribeToDesktopBreakpoint(fixture.mediaQuery, () => {
    closeCount += 1;
  });

  fixture.emit(true);
  fixture.emit(false);

  assert.equal(closeCount, 1);

  cleanup();
  assert.equal(fixture.wasCleanedUp(), true);
});
