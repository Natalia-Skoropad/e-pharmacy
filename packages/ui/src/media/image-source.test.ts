import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeImageSource } from './image-source';
import { chooseManagedPhotoSize } from './managed-photo-url';

//===================================================================

test('normalizes absolute seed image URLs to the current application origin', () => {
  assert.equal(
    normalizeImageSource(
      'http://localhost:3000/images/seed/pharmacies/pharmacy-021.png'
    ),
    '/images/seed/pharmacies/pharmacy-021.png'
  );

  assert.equal(
    normalizeImageSource(
      'https://old-client.example.com/images/seed/pharmacies/pharmacy-001.png'
    ),
    '/images/seed/pharmacies/pharmacy-001.png'
  );
});

//===================================================================

test('keeps non-seed image sources unchanged', () => {
  assert.equal(
    normalizeImageSource('https://images.unsplash.com/photo.jpg'),
    'https://images.unsplash.com/photo.jpg'
  );
  assert.equal(
    normalizeImageSource('/images/profile/client.png'),
    '/images/profile/client.png'
  );
});

//===================================================================

test('selects the correct managed photo derivative and preserves old sources', () => {
  const image = '/api/media/0123456789abcdef01234567/large';

  assert.equal(
    chooseManagedPhotoSize(image, 'thumb'),
    '/api/media/0123456789abcdef01234567/thumb'
  );

  assert.equal(
    chooseManagedPhotoSize(image, 'medium'),
    '/api/media/0123456789abcdef01234567/medium'
  );

  assert.equal(chooseManagedPhotoSize(image, 'large'), image);

  assert.equal(
    chooseManagedPhotoSize('data:image/png;base64,AA==', 'thumb'),
    'data:image/png;base64,AA=='
  );

  assert.equal(
    chooseManagedPhotoSize('https://example.com/image.webp', 'medium'),
    'https://example.com/image.webp'
  );
});
