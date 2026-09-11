import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveCanonicalDraftSync } from './pharmacy-profile-draft-sync';

//===================================================================

test('pristine profile draft follows a newer canonical provider value', () => {
  const canonical = { name: 'Pharmacy A', address: 'New address' };

  const result = resolveCanonicalDraftSync({
    canonicalValue: canonical,
    isDirty: false,
  });

  assert.ok(result);
  assert.equal(result.value, canonical);
  assert.equal(result.baseline, canonical);
});

//===================================================================

test('dirty profile draft is left untouched when provider refreshes', () => {
  const canonical = { name: 'Pharmacy A', address: 'Server address' };

  const result = resolveCanonicalDraftSync({
    canonicalValue: canonical,
    isDirty: true,
  });

  assert.equal(result, null);
});
