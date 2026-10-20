import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const source = (relativePath: string): string =>
  readFileSync(resolve(process.cwd(), 'src', relativePath), 'utf8');

const listRoute = source('app/api/pharmacy-owners/me/comments/route.ts');

const deleteRoute = source(
  'app/api/pharmacy-owners/me/comments/[commentId]/route.ts'
);

const browser = source('lib/api/browser/pharmacy-user-private-comments.api.ts');
const apiRoutes = source('lib/api/routes/pharmacy-api-routes.ts');

//===================================================================

test('self-only private BFF uses authenticated backend paths', () => {
  assert.match(listRoute, /createPrivateProxyRoute/);
  assert.match(listRoute, /method: 'GET'/);
  assert.match(listRoute, /method: 'POST'/);
  assert.match(deleteRoute, /createPrivateProxyRoute<Params>/);
  assert.match(deleteRoute, /method: 'DELETE'/);
  assert.doesNotMatch(listRoute + deleteRoute, /pharmacyId|ownerId|employeeId/);
  assert.match(apiRoutes, /myComments: '\/api\/pharmacy-owners\/me\/comments'/);
  assert.match(apiRoutes, /myComment: \(commentId: string\)/);
});

//===================================================================

test('personal private comments browser adapter validates responses', () => {
  assert.match(browser, /parsePharmacyUserPrivateNotesResponse/);
  assert.match(browser, /parsePharmacyUserPrivateNoteResponse/);
  assert.match(browser, /CreatePharmacyUserPrivateNotePayload/);
  assert.match(browser, /method: 'DELETE'/);
  assert.match(browser, /responseType: 'no-content'/);
  assert.doesNotMatch(browser, /pharmacyNotes\.|adminEmployees\./);
});
