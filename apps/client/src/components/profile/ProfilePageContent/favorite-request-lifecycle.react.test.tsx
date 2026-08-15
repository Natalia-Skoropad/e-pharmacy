import assert from 'node:assert/strict';
import test from 'node:test';

import { isCurrentFavoriteRequest } from './favorite-request-lifecycle';

//===================================================================

test('same-user favorite requests reject stale page responses', () => {
  assert.equal(
    isCurrentFavoriteRequest({
      currentVersion: 4,
      requestVersion: 3,
      aborted: false,
    }),
    false
  );
});

//===================================================================

test('only the latest non-aborted favorite request may commit', () => {
  assert.equal(
    isCurrentFavoriteRequest({
      currentVersion: 5,
      requestVersion: 5,
      aborted: false,
    }),
    true
  );

  assert.equal(
    isCurrentFavoriteRequest({
      currentVersion: 5,
      requestVersion: 5,
      aborted: true,
    }),
    false
  );
});
