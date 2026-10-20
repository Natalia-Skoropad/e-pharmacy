import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const profile = readFileSync(
  new URL('./PharmacyProfilePageContent.tsx', import.meta.url),
  'utf8'
);

const route = readFileSync(
  new URL('../../../app/pharmacy/profile/[tab]/page.tsx', import.meta.url),
  'utf8'
);

const documentPanel = readFileSync(
  new URL('../OwnerDocumentsPanel/OwnerDocumentsPanel.tsx', import.meta.url),
  'utf8'
);

//===================================================================

test('exactly four owner account tabs can be direct-linked', () => {
  for (const tab of ['data', 'documents', 'comments', 'sessions']) {
    assert.match(profile, new RegExp(`value: '${tab}'`));
  }

  for (const tab of ['documents', 'comments', 'sessions'])
    assert.match(route, new RegExp(`'${tab}'`));

  for (const old of ['pharmacy-data', 'about', 'payment', 'reviews'])
    assert.doesNotMatch(route, new RegExp(`'${old}'`));

  assert.match(route, /notFound\(\)/);
  assert.match(profile, /window\.history\.pushState/);
  assert.match(profile, /<ProfileTabsLayout/);
  assert.match(profile, /<ProfileTabPanel/);
});

//===================================================================

test('owner resources mount only in the active tab and personal route has no pharmacy forms', () => {
  assert.match(
    profile,
    /activeTab === 'documents'[\s\S]*?<OwnerDocumentsPanel \/>/
  );

  assert.match(
    profile,
    /activeTab === 'comments'[\s\S]*?<OwnerPrivateComments \/>/
  );

  assert.match(
    profile,
    /activeTab === 'sessions'[\s\S]*?<OwnerActiveSessionsSection/
  );

  assert.match(documentPanel, /<DocumentsPanel/);

  assert.doesNotMatch(
    profile,
    /Pharmacy documents|Pharmacy status|sendMyPharmacyForVerification|membershipRole|usePharmacyProfile|pharmacy\.id/
  );
});
