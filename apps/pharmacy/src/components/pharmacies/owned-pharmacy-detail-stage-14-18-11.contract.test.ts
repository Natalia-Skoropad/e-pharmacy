import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const source = (file: string) =>
  readFileSync(new URL(file, import.meta.url), 'utf8');

const detail = source(
  './OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
);

const editor = source('./OwnedPharmacyEditor/OwnedPharmacyEditor.tsx');
const backend = source('../../lib/api/browser/owned-pharmacy-registry.api.ts');

const service = source(
  '../../../../api/src/services/pharmacies/owned-pharmacy-registry-read.service.ts'
);

const parser = source(
  '../../../../../packages/api-client/src/response/owned-pharmacy-registry-parsers.ts'
);

//===================================================================

test('owner detail uses scoped response, reusable UI and status-aware owner actions', () => {
  for (const name of [
    'PageHeader',
    'StatusBadge',
    'StatsCard',
    'StatsGrid',
    'Tabs',
    'ProfileSectionHeader',
  ]) {
    assert.match(detail, new RegExp(`<${name}\\b`));
  }

  assert.match(detail, /getOwnedPharmacyDetail\(pharmacyId/);
  assert.match(detail, /sendOwnedPharmacyForVerification\(pharmacyId\)/);
  assert.match(detail, /membershipRole === 'owner'/);
  assert.match(detail, /changes_requested/);

  assert.doesNotMatch(
    detail,
    /Manage pharmacy status|Pharmacy owner|Published working hours/
  );

  assert.match(backend, /parseOwnedPharmacyDetailResponse/);
});

//===================================================================

test('owner detail dates come from persisted timestamps and audit, not guesses', () => {
  assert.match(service, /getPharmacyMembership\(/);
  assert.match(service, /PHARMACY_MODERATION_SUBMITTED/);
  assert.match(service, /submission\.createdAt\.toISOString\(\)/);
  assert.match(parser, /isoDate\(dates\.createdAt\)/);
  assert.match(parser, /isoDate\(dates\.submittedAt\)/);
  assert.match(detail, /<DateValue value=\{dates\.submittedAt\}/);
});

//===================================================================

test('editor uses shared confirmation and photo feedback', () => {
  assert.match(editor, /<ConfirmationModal/);

  assert.match(
    editor,
    /toast\.success\(\s*url\s*\?\s*'Pharmacy photo updated\.'\s*:\s*'Pharmacy photo removed\.'\s*\)/
  );

  assert.doesNotMatch(editor, /window\.confirm\(/);
});

//===================================================================

test('detail tabs follow the admin URL and resource-mounting model', () => {
  const route = source('../../lib/pharmacies/owned-pharmacy-url.ts');
  const page = source('../../app/pharmacy/pharmacies/[...filters]/page.tsx');

  for (const tab of [
    'documents',
    'comments',
    'reviews',
    'orders',
    'clients',
    'products',
    'product-requests',
    'activity',
  ]) {
    assert.match(route, new RegExp(`'${tab}'`));
    assert.match(detail, new RegExp(`value: '${tab}'`));
  }

  assert.match(
    detail,
    /router\.replace\(buildOwnedPharmacyDetailUrl\(pharmacyId, tab\)/
  );

  assert.match(detail, /<PharmacyAboutFields/);
  assert.match(detail, /<PharmacyPaymentFields/);
  assert.match(detail, /<DocumentsPanel/);
  assert.match(detail, /<EntityComments/);
  assert.match(page, /activeTab=\{route\.tab\}/);
});

//===================================================================

test('pharmacy list search option includes server-scoped pharmacy photos and matches admin', () => {
  const options = source('./OwnedPharmacySearch/OwnedPharmacySearch.tsx');

  const types = source(
    '../../../../../packages/types/src/pharmacies/owned-pharmacy-registry.ts'
  );

  assert.match(options, /src=\{pharmacy\.imageUrl\}/);
  assert.match(options, /Name, ID, email, phone, or address/);
  assert.match(types, /imageUrl\?: string/);
});
