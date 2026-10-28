import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (file: string) =>
  readFileSync(new URL(file, import.meta.url), 'utf8');

const actions = read(
  './OwnedPharmacyDetailPageContent/OwnedPharmacyActions.tsx'
);

const detail = read(
  './OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
);

const review = read(
  './OwnedPharmacyDetailPageContent/OwnedPharmacySectionReview.tsx'
);

const editor = read(
  './OwnedPharmacyDetailPageContent/OwnedPharmacyEditableTab.tsx'
);

const styles = read(
  './OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.module.css'
);

//===================================================================

test('owner moderation and verification live in one accessible Admin-style dropdown', () => {
  assert.match(actions, /aria-haspopup="menu"/);
  assert.match(actions, /role="menuitem"/);
  assert.match(actions, /Send for verification/);
  assert.match(actions, /Send for moderation/);
  assert.match(actions, /disabled=\{!eligibility\?\.canDeactivate\}/);
  assert.match(actions, /Deactivation requirements/);
  assert.match(styles, /\.approveAction[\s\S]*?\.dangerAction/);
});

//===================================================================

test('editable detail tabs use one Save changes action, without duplicate page headings', () => {
  assert.match(editor, /Save changes/);

  assert.match(
    detail,
    /\['data', 'about', 'payment', 'documents', 'comments'\]/
  );

  assert.match(styles, /\.sectionActions > button\s*\{\s*width: 100%/);
});

//===================================================================

test('pending comparison appears before edit and each field can be discarded independently', () => {
  assert.match(
    detail,
    /<OwnedPharmacySectionReview[\s\S]*?<OwnedPharmacyEditableTab/
  );

  assert.match(review, /change\.field/);
  assert.match(review, /<ConfirmationModal/);
  assert.match(review, /discardOwnedPharmacyPendingSection/);
  assert.match(review, /<MarkdownContent/);

  assert.match(
    styles,
    /\.reviewValues\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/
  );
});
