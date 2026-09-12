import assert from 'node:assert/strict';
import test from 'node:test';

import { isFullscreenAvailable, toggleFullscreen } from './fullscreen';

//===================================================================

test('fullscreen is unavailable when enter or exit capability is missing', async () => {
  const unsupported = {
    fullscreenEnabled: true,
    fullscreenElement: null,
    documentElement: {},
  };

  assert.equal(isFullscreenAvailable(unsupported), false);
  assert.equal(await toggleFullscreen(unsupported), 'unsupported');
});

//===================================================================

test('fullscreen toggle enters and exits using the current browser state', async () => {
  const calls: string[] = [];

  const enterDocument = {
    fullscreenEnabled: true,
    fullscreenElement: null,
    documentElement: {
      requestFullscreen: async () => {
        calls.push('enter');
      },
    },
    exitFullscreen: async () => {
      calls.push('exit');
    },
  };

  assert.equal(await toggleFullscreen(enterDocument), 'entered');
  assert.deepEqual(calls, ['enter']);

  const exitDocument = {
    ...enterDocument,
    fullscreenElement: {},
  };

  assert.equal(await toggleFullscreen(exitDocument), 'exited');
  assert.deepEqual(calls, ['enter', 'exit']);
});

//===================================================================

test('fullscreen rejection is handled without leaking a technical error', async () => {
  const rejectedDocument = {
    fullscreenEnabled: true,
    fullscreenElement: null,
    documentElement: {
      requestFullscreen: async () => {
        throw new Error('denied');
      },
    },
    exitFullscreen: async () => undefined,
  };

  assert.equal(await toggleFullscreen(rejectedDocument), 'rejected');
});
