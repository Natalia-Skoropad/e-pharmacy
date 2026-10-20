import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parsePharmacyUserPrivateNoteResponse,
  parsePharmacyUserPrivateNotesResponse,
} from './pharmacy-user-private-notes';

//===================================================================

const example = {
  id: '507f1f77bcf86cd799439011',
  text: 'My private comment',
  createdAt: '2026-10-20T12:00:00.000Z',
  author: { userId: '507f191e810c19729de860ea', displayName: 'Owner' },
};

//===================================================================

test('private comment parser returns the shared Comments UI shape', () => {
  assert.deepEqual(parsePharmacyUserPrivateNoteResponse({ note: example }), {
    note: example,
  });

  assert.deepEqual(
    parsePharmacyUserPrivateNotesResponse({
      items: [example],
      page: 1,
      perPage: 10,
      total: 1,
      totalPages: 1,
    }).items,

    [example]
  );
});

//===================================================================

test('private comment parser rejects malformed private data', () => {
  assert.throws(() =>
    parsePharmacyUserPrivateNoteResponse({ note: { ...example, author: null } })
  );

  assert.throws(() =>
    parsePharmacyUserPrivateNotesResponse({
      items: [],
      page: 0,
      perPage: 10,
      total: 0,
      totalPages: 0,
    })
  );

  assert.throws(() =>
    parsePharmacyUserPrivateNotesResponse({
      items: [{ ...example, createdAt: 'bad' }],
      page: 1,
      perPage: 10,
      total: 1,
      totalPages: 1,
    })
  );
});
