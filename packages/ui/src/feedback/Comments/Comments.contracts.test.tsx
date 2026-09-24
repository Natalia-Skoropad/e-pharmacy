import assert from 'node:assert/strict';
import test from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import { CommentsList } from './Comments';

//===================================================================

type AdminPrivateComment = Readonly<{
  id: string;
  text: string;
  createdAt: string;
  author: Readonly<{
    displayName: string;
    employeeId: string;
  }>;
}>;

//===================================================================

test('comments presentation accepts non-pharmacy note contracts', () => {
  const items: AdminPrivateComment[] = [
    {
      id: 'comment-1',
      text: 'Private employee note',
      createdAt: '2026-09-24T10:00:00.000Z',
      author: {
        displayName: 'Platform Owner',
        employeeId: 'employee-1',
      },
    },
  ];

  const handleDelete = (_comment: AdminPrivateComment) => undefined;

  const markup = renderToStaticMarkup(
    <CommentsList items={items} onDelete={handleDelete} />
  );

  assert.match(markup, /Platform Owner/);
  assert.match(markup, /Private employee note/);
  assert.match(markup, />Delete</);
});
