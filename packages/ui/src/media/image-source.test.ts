import assert from 'node:assert/strict';
import test from 'node:test';

import { chooseSeedImageSize, normalizeImageSource } from './image-source';
import { chooseManagedPhotoSize } from './managed-photo-url';
import { PHOTO_PRESETS } from './photo-presets';

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

//===================================================================

test('selects WebP derivatives for legacy catalog seed photos only', () => {
  const oldProduct = '/images/seed/products/product-021.png';
  const oldPharmacy = '/images/seed/pharmacies/pharmacy-002.png';

  assert.equal(
    chooseSeedImageSize(oldProduct, 'thumb'),
    '/images/seed/products/product-021-thumb.webp'
  );

  assert.equal(
    chooseSeedImageSize(oldPharmacy, 'medium'),
    '/images/seed/pharmacies/pharmacy-002-medium.webp'
  );

  assert.equal(
    chooseSeedImageSize(oldPharmacy, 'large'),
    '/images/seed/pharmacies/pharmacy-002-large.webp'
  );

  assert.equal(
    chooseSeedImageSize('/images/seed/clients/client-002.png', 'thumb'),
    '/images/seed/clients/client-002.png'
  );

  assert.equal(
    chooseSeedImageSize('/api/media/0123456789abcdef01234567/large', 'thumb'),
    '/api/media/0123456789abcdef01234567/large'
  );
});

//===================================================================

test('shared photo presets select compact sources for table/search and large sources for details', () => {
  assert.equal(PHOTO_PRESETS.table.mediaSize, 'thumb');
  assert.equal(PHOTO_PRESETS.search.mediaSize, 'thumb');
  assert.equal(PHOTO_PRESETS.compact.mediaSize, 'medium');
  assert.equal(PHOTO_PRESETS.panel.mediaSize, 'medium');
  assert.equal(PHOTO_PRESETS.card.mediaSize, 'medium');
  assert.equal(PHOTO_PRESETS.offer.mediaSize, 'medium');
  assert.equal(PHOTO_PRESETS.detail.mediaSize, 'large');
  assert.equal(PHOTO_PRESETS.hero.mediaSize, 'large');

  assert.equal(PHOTO_PRESETS.table.sizes, '48px');
  assert.equal(PHOTO_PRESETS.search.sizes, '64px');

  for (const preset of ['card', 'offer', 'hero'] as const) {
    assert.match(PHOTO_PRESETS[preset].sizes, /max-width: 767px/);
    assert.match(PHOTO_PRESETS[preset].sizes, /max-width: 1439px/);
    assert.match(PHOTO_PRESETS[preset].sizes, /\d+px$/);
  }
});
