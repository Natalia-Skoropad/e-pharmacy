import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

test('UserBadge owns broken-image fallback while ImagePreview stays generic', async () => {
  const [userBadge, imagePreview] = await Promise.all([
    readFile(new URL('./UserBadge.tsx', import.meta.url), 'utf8'),

    readFile(
      new URL('../../media/ImagePreview/ImagePreview.tsx', import.meta.url),
      'utf8'
    ),
  ]);

  assert.match(userBadge, /shouldRenderUserBadgePicture/);

  assert.match(
    userBadge,
    /onError=\{\(\) => setFailedPictureUrl\(pictureUrl\)\}/
  );

  assert.match(userBadge, /formatInitials\(label\)/);

  assert.match(imagePreview, /\.\.\.props/);
  assert.doesNotMatch(imagePreview, /fallback|initials/i);
});
