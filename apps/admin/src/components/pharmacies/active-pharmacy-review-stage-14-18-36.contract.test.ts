import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

//===================================================================

const root = fileURLToPath(new URL('../../../../../', import.meta.url));

const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

//===================================================================

const admin =
  'apps/admin/src/components/pharmacies/PharmacyDetailsPageContent/';

const owner =
  'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/';

//===================================================================

test('Stage 14.18.36: active Admin menu retains disabled approval and corrections until submission', () => {
  const actions = read(`${admin}PharmacyModerationActions.tsx`);

  const block = actions.slice(
    actions.indexOf("detail.status === 'active'"),

    actions.indexOf(
      ': menuEntries;',
      actions.indexOf("detail.status === 'active'")
    )
  );

  assert.match(block, /label: 'Approve changes'/);
  assert.match(block, /label: 'Request corrections'/);
  assert.match(block, /disabled: true as const/g);
  assert.match(block, /owner has not submitted changes for moderation/);
  assert.match(actions, /<InfoTooltip/);
});

//===================================================================

test('Stage 14.18.36: both cabinets show public link only on information tab for public statuses', () => {
  const adminSource = read(`${admin}PharmacyDetailsPageContent.tsx`);
  const pharmacySource = read(`${owner}OwnedPharmacyDetailPageContent.tsx`);

  const adminLink = read(
    'apps/admin/src/lib/pharmacies/public-pharmacy-link.ts'
  );

  const ownerLink = read('apps/pharmacy/src/lib/layout/external-links.ts');

  assert.match(
    adminSource,
    /activeTab === 'information' && publicPharmacyHref/
  );

  assert.match(
    pharmacySource,
    /visibleTab === 'information' && publicPharmacyHref/
  );

  assert.match(adminSource, /rel="noopener noreferrer"/);
  assert.match(pharmacySource, /rel="noopener noreferrer"/);

  assert.match(
    adminLink,
    /status !== 'active' && pharmacy.status !== 'on_moderation'/
  );

  assert.match(
    ownerSourceStatus(),
    /status === 'active' \|\| status === 'on_moderation'/
  );

  assert.match(adminLink, /buildPublicEntitySlugId\('pharmacy'/);
  assert.match(ownerLink, /buildPublicEntitySlugId\(/);

  assert.doesNotMatch(
    ownerSourceStatus(),
    /status === 'new' \|\| status === 'on_moderation'/
  );
});

//===================================================================

function ownerSourceStatus() {
  return read('apps/pharmacy/src/lib/layout/external-links.ts');
}

//===================================================================

test('Stage 14.18.36: public button is full width only on phones in both cabinets', () => {
  for (const file of [
    `${admin}PharmacyDetailsPageContent.module.css`,
    `${owner}OwnedPharmacyDetailPageContent.module.css`,
  ]) {
    const css = read(file);

    assert.match(css, /\.publicPharmacyLink/);

    assert.match(
      css,
      /@media \(max-width: 767px\)\s*\{[^}]*\.publicPharmacyLink[^}]*width: 100%/
    );
  }
});

//===================================================================

test('Stage 14.18.36: Admin detail exposes only document filenames for approved and pending changes', () => {
  const api = read(
    'apps/api/src/services/admin/pharmacies/admin-pharmacy-detail-read.service.ts'
  );

  const types = read('packages/types/src/admin/pharmacy-detail.ts');

  const parser = read(
    'packages/api-client/src/response/admin-pharmacy-detail-parsers.ts'
  );

  assert.match(
    api,
    /publishedDocumentNames:\s*\(pharmacy\.documents \?\? \[\]\)\.map\(\(document\) => document\.name\)/
  );

  assert.match(
    api,
    /documentNames: pending\.documents\.map\(\(document\) => document\.name\)/
  );

  assert.match(types, /publishedDocumentNames\?: readonly string\[\]/);
  assert.match(types, /documentNames\?: readonly string\[\]/);
  assert.match(parser, /Invalid published document names/);
  assert.match(parser, /Invalid pending document names/);

  assert.doesNotMatch(
    api,
    /pending\.documents\.map\(\(document\) => \(\{\s*\.\.\.document/
  );
});

//===================================================================

test('Stage 14.18.36: Admin Documents shows name-level Added/Removed without an owner-only remove action', () => {
  const review = read(`${admin}PharmacyReviewSummary.tsx`);
  const docs = read(`${admin}PharmacyDocumentsTab.tsx`);

  assert.match(review, /pending\.documentNames\?\.join/);
  assert.match(review, /detail\.publishedDocumentNames\?\.join/);
  assert.match(review, /'Removed' : 'Added'/);
  assert.match(review, /value === change\.current/);
  assert.doesNotMatch(review, /Remove change|readOnlyRemove|removeButton/);
  assert.doesNotMatch(review, /<Button|<InfoTooltip/);
  assert.match(docs, /section="documents"/);
});
