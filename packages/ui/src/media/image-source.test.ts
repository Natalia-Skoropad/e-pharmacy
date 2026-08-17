import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeImageSource } from './image-source';

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
