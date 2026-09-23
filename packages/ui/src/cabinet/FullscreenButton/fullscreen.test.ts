import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isFullscreenAvailable,
  toggleFullscreen,
  type FullscreenDocumentLike,
} from './fullscreen';

//===================================================================

function createDocumentLike(
  overrides: Partial<FullscreenDocumentLike> = {}
): FullscreenDocumentLike {
  return {
    fullscreenEnabled: true,
    fullscreenElement: null,

    documentElement: {
      requestFullscreen: async () => undefined,
    },

    exitFullscreen: async () => undefined,
    ...overrides,
  };
}

//===================================================================

test('fullscreen availability requires enter and exit APIs', () => {
  assert.equal(isFullscreenAvailable(createDocumentLike()), true);
  assert.equal(
    isFullscreenAvailable(
      createDocumentLike({
        documentElement: {},
      })
    ),
    false
  );

  assert.equal(
    isFullscreenAvailable(
      createDocumentLike({
        exitFullscreen: undefined,
      })
    ),
    false
  );
});

//===================================================================

test('fullscreen toggle enters and exits based on the current document state', async () => {
  let entered = 0;
  let exited = 0;

  const enterResult = await toggleFullscreen(
    createDocumentLike({
      documentElement: {
        requestFullscreen: async () => {
          entered += 1;
        },
      },
    })
  );

  const exitResult = await toggleFullscreen(
    createDocumentLike({
      fullscreenElement: {},
      exitFullscreen: async () => {
        exited += 1;
      },
    })
  );

  assert.equal(enterResult, 'entered');
  assert.equal(exitResult, 'exited');
  assert.equal(entered, 1);
  assert.equal(exited, 1);
});

//===================================================================

test('fullscreen toggle fails closed for unsupported and rejected APIs', async () => {
  assert.equal(
    await toggleFullscreen(
      createDocumentLike({
        fullscreenEnabled: false,
      })
    ),
    'unsupported'
  );

  assert.equal(
    await toggleFullscreen(
      createDocumentLike({
        documentElement: {
          requestFullscreen: async () => {
            throw new Error('denied');
          },
        },
      })
    ),
    'rejected'
  );
});
