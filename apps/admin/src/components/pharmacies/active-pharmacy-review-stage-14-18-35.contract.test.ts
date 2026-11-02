import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

//===================================================================

const projectRoot = fileURLToPath(new URL('../../../../../', import.meta.url));

const source = (relativePath: string) =>
  readFileSync(path.join(projectRoot, relativePath), 'utf8');

//===================================================================

test('Stage 14.18.35: Admin Data forms use only published values', () => {
  const file = source(
    'apps/admin/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyDataTab.tsx'
  );

  assert.match(file, /const current = detail\.current/);
  assert.match(file, /const location = current\.location/);
  assert.match(file, /const effective = current/);

  assert.doesNotMatch(
    file,
    /pending\?\.name|pending\?\.imageUrl|pending\?\.workingHours/
  );

  assert.match(file, /<PharmacyReviewSummary detail=\{detail\} section="data"/);
});

//===================================================================

test('Stage 14.18.35: comparison precedes approved About and Payment forms', () => {
  const base =
    'apps/admin/src/components/pharmacies/PharmacyDetailsPageContent/';

  const about = source(`${base}PharmacyAboutTab.tsx`);
  const payment = source(`${base}PharmacyPaymentTab.tsx`);

  assert.ok(
    about.indexOf('<PharmacyReviewSummary') <
      about.indexOf('<PharmacyAboutFields')
  );

  assert.ok(
    payment.indexOf('<PharmacyReviewSummary') <
      payment.indexOf('<PharmacyPaymentFields')
  );

  const docs = source(`${base}PharmacyDocumentsTab.tsx`);
  const review = source(`${base}PharmacyReviewSummary.tsx`);

  assert.match(docs, /section="documents"/);
  assert.match(review, /pending\.documentsCount === undefined/);
});

//===================================================================

test('Stage 14.18.35: active Admin actions include disabled approval and full-width menu options', () => {
  const base =
    'apps/admin/src/components/pharmacies/PharmacyDetailsPageContent/';

  const actions = source(`${base}PharmacyModerationActions.tsx`);
  const styles = source(`${base}PharmacyModerationActions.module.css`);

  assert.match(actions, /detail\.status === 'active'/);
  assert.match(actions, /label: 'Approve changes'/);
  assert.match(actions, /disabled: true as const/);
  assert.match(actions, /visibleMenuEntries\.map/);

  assert.doesNotMatch(
    actions,
    /Owner changes are saved as a draft, but have not been submitted/
  );

  assert.match(
    styles,
    /\.menuActionRow > button:first-child\s*\{[^}]*width:\s*100%/
  );
});

//===================================================================

test('Stage 14.18.35: reason is not repeated as identical audit feedback', () => {
  const modal = source(
    'apps/admin/src/components/activity/AuditDetailsModal.tsx'
  );

  assert.match(
    modal,
    /details\.after\.reviewFeedback\.trim\(\) === details\.reason\.trim\(\)/
  );
});

//===================================================================

test('Stage 14.18.35: creation is distinct from New; moderation is yellow with one card', () => {
  const base =
    'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/';

  const info = source(`${base}OwnedPharmacyInformationTab.tsx`);
  const actions = source(`${base}OwnedPharmacyActions.tsx`);
  const styles = source(`${base}OwnedPharmacyDetailPageContent.module.css`);

  assert.match(info, /event\.action === 'pharmacy\.created' \? \(/);
  assert.match(info, />Created<\/span>/);
  assert.match(styles, /\.createdStatus\s*\{[^}]*color:\s*#2778c4/);
  assert.match(actions, /className=\{css\.moderationAction\}/);
  assert.match(actions, /details=\{\s*action === 'moderation' \? \(/);
  assert.doesNotMatch(actions, /moderationJourney/);
});

//===================================================================

test('Stage 14.18.35: public pharmacy About reuses canonical safe Markdown renderer', () => {
  const panel = source(
    'apps/client/src/components/pharmacies/PharmacyDetailsPageContent/PharmacyAboutPanel.tsx'
  );

  assert.match(
    panel,
    /import \{ MarkdownContent \} from '@e-pharmacy\/ui\/data-display'/
  );

  assert.match(panel, /<MarkdownContent/);
  assert.doesNotMatch(panel, /function parseDescription/);
});
