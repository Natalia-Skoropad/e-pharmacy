import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseAdminEmployeePrivateNoteResponse,
  parseAdminEmployeePrivateNotesResponse,
} from './admin-employee-private-notes';

//===================================================================

const note = {
  id: '507f1f77bcf86cd799439011',
  text: 'Only I can see this comment.',
  createdAt: '2026-09-24T10:00:00.000Z',
  author: {
    userId: '507f191e810c19729de860ea',
    displayName: 'Admin Employee',
  },
};

//===================================================================

test('admin private comment parsers accept the canonical paginated contract', () => {
  assert.deepEqual(
    parseAdminEmployeePrivateNotesResponse({
      items: [note],
      page: 1,
      perPage: 10,
      total: 1,
      totalPages: 1,
    }),
    {
      items: [note],
      page: 1,
      perPage: 10,
      total: 1,
      totalPages: 1,
    }
  );

  assert.deepEqual(parseAdminEmployeePrivateNoteResponse({ note }), { note });
});

//===================================================================

test('admin private comment parsers fail closed for malformed data', () => {
  assert.throws(
    () =>
      parseAdminEmployeePrivateNotesResponse({
        items: [{ ...note, author: { ...note.author, userId: '' } }],
        page: 1,
        perPage: 10,
        total: 1,
        totalPages: 1,
      }),
    /invalid private comment author userId/i
  );

  assert.throws(
    () =>
      parseAdminEmployeePrivateNotesResponse({
        items: [note],
        page: 0,
        perPage: 10,
        total: 1,
        totalPages: 1,
      }),
    /invalid private comments page/i
  );
});
