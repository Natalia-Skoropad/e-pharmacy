import assert from 'node:assert/strict';
import test from 'node:test';

import {
  subscribeToDesktopBreakpoint,
  type DesktopBreakpointChangeEvent,
} from './desktop-breakpoint-lifecycle';

//===================================================================

type ChangeListener = (event: DesktopBreakpointChangeEvent) => void;

//===================================================================

function createMediaQuery(matches: boolean) {
  let listener: ChangeListener | null = null;

  return {
    mediaQuery: {
      matches,
      addEventListener: (_type: 'change', nextListener: ChangeListener) => {
        listener = nextListener;
      },

      removeEventListener: (
        _type: 'change',
        currentListener: ChangeListener
      ) => {
        if (listener === currentListener) listener = null;
      },
    },

    emit(nextMatches: boolean) {
      listener?.({ matches: nextMatches });
    },

    hasListener() {
      return listener !== null;
    },
  };
}

//===================================================================

test('closes an already-open mobile overlay when desktop is active', () => {
  const fake = createMediaQuery(true);
  let closeCalls = 0;

  const unsubscribe = subscribeToDesktopBreakpoint(fake.mediaQuery, () => {
    closeCalls += 1;
  });

  assert.equal(closeCalls, 1);
  assert.equal(fake.hasListener(), true);

  unsubscribe();
  assert.equal(fake.hasListener(), false);
});

//===================================================================

test('closes on a mobile-to-desktop transition and ignores mobile changes', () => {
  const fake = createMediaQuery(false);
  let closeCalls = 0;

  const unsubscribe = subscribeToDesktopBreakpoint(fake.mediaQuery, () => {
    closeCalls += 1;
  });

  fake.emit(false);
  assert.equal(closeCalls, 0);

  fake.emit(true);
  assert.equal(closeCalls, 1);

  unsubscribe();
  fake.emit(true);
  assert.equal(closeCalls, 1);
});
