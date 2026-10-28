import assert from 'node:assert/strict';
import test from 'node:test';

import { mergeProposedPharmacyDocuments } from './pharmacy-document-changes';

//===================================================================

const file = (id: string) => ({
  id,
  name: `${id}.pdf`,
  size: 1024,
  type: 'application/pdf',
});

//===================================================================

test('saving new files preserves existing submitted documents', () => {
  const published = [file('a')];
  const proposed = [file('a'), file('b')];
  const selected = [file('a'), file('c')];

  assert.deepEqual(
    mergeProposedPharmacyDocuments(published, selected, proposed).map(
      (document) => document.id
    ),
    ['a', 'b', 'c']
  );
});

//===================================================================

test('removing a published file does not remove other pending files', () => {
  const published = [file('a'), file('b')];
  const proposed = [file('a'), file('b'), file('c')];

  assert.deepEqual(
    mergeProposedPharmacyDocuments(published, [file('b')], proposed).map(
      (document) => document.id
    ),
    ['b', 'c']
  );
});

//===================================================================

test('repeated edits never duplicate the same document ID', () => {
  assert.deepEqual(
    mergeProposedPharmacyDocuments(
      [file('a')],
      [file('a'), file('b')],
      [file('a'), file('b')]
    ).map((document) => document.id),
    ['a', 'b']
  );
});
