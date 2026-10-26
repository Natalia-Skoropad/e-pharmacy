import assert from 'node:assert/strict';
import test from 'node:test';

import { createFlexibleSearchRegExp } from './regexp';

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
