import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createCanonicalLocationRegExp,
  createFlexibleSearchRegExp,
} from './regexp';

//===================================================================

test('matches addresses when punctuation is omitted from the search value', () => {
  const expression = createFlexibleSearchRegExp('777 Wellness Street Lviv');

  assert.match('777 Wellness Street, Lviv', expression);
});

//===================================================================

test('matches pharmacy names across hyphenated words', () => {
  const expression = createFlexibleSearchRegExp(
    'DobroMed Pharmacy Ivano Frankivsk 81'
  );

  assert.match('DobroMed Pharmacy Ivano-Frankivsk 81', expression);
});

//===================================================================

test('SEO location slugs resolve stored hyphens, spaces and punctuation', () => {
  const settlement = createCanonicalLocationRegExp('Ivano Frankivsk');

  assert.match('Ivano-Frankivsk', settlement);
  assert.match(' Ivano Frankivsk ', settlement);
  assert.match('IVANO–FRANKIVSK', settlement);
  assert.doesNotMatch('Ivano Frankivsk Extra', settlement);
  assert.doesNotMatch('Frankivsk', settlement);

  const region = createCanonicalLocationRegExp('Ivano Frankivsk region');

  assert.match('Ivano-Frankivsk region', region);
  assert.doesNotMatch('Lviv region', region);
});
