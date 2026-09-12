import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldRenderUserBadgePicture } from './user-badge-picture-state';

//===================================================================

test('valid image URLs render until that exact URL reports an error', () => {
  assert.equal(
    shouldRenderUserBadgePicture('https://cdn.example/avatar.jpg', null),
    true
  );

  assert.equal(
    shouldRenderUserBadgePicture(
      'https://cdn.example/avatar.jpg',
      'https://cdn.example/avatar.jpg'
    ),
    false
  );
});

//===================================================================

test('missing image URLs use initials and a new URL can retry after an older failure', () => {
  assert.equal(shouldRenderUserBadgePicture(null, null), false);
  assert.equal(shouldRenderUserBadgePicture(undefined, null), false);

  assert.equal(
    shouldRenderUserBadgePicture(
      'https://cdn.example/new-avatar.jpg',
      'https://cdn.example/old-avatar.jpg'
    ),
    true
  );
});
