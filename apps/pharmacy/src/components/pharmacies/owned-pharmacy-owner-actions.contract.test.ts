import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (file: string) =>
  readFileSync(new URL(file, import.meta.url), 'utf8');

//===================================================================

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

const help = read('./OwnedPharmacyDetailPageContent/OwnedPharmacyHelp.tsx');

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
  assert.match(actions, /pharmacy\.status === 'active'/);
  assert.match(actions, /pharmacy\.status === 'on_verification'/);
  assert.match(actions, /Resend for verification/);
  assert.match(actions, /Cancel\s+verification request/);

  // Both the page heading and disabled status actions reuse the same shared tooltip.
  assert.match(actions, /<InfoTooltip/);
  assert.match(actions, /escapeOverflow/);
  assert.match(help, /<InfoTooltip/);
  assert.match(help, /Unfinished orders/);
  assert.match(help, /Unfinished product requests/);
  assert.match(detail, /<OwnedPharmacyHelp/);
  assert.match(styles, /\.approveAction[\s\S]*?\.dangerAction/);
});

//===================================================================

test('editable detail tabs use one Save changes action, without duplicate page headings', () => {
  assert.match(editor, /Save changes/);

  assert.match(detail, /visibleTab !== 'comments'/);

  // The loading skeleton must not render an extra heading above the editor.
  assert.doesNotMatch(detail, /loading && activeTab !== 'comments'\) \|\|/);

  assert.match(styles, /\.sectionActions > button,\s*\.statusMenu/);
  assert.match(styles, /@media \(min-width: 768px\)/);
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
  assert.match(review, /<WorkingHours/);
  assert.match(review, /<ShimmerImage/);
  assert.match(review, /cancelIconLeft/);
  assert.match(editor, /valuesFromPharmacy/);

  assert.match(
    styles,
    /\.reviewValues\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/
  );
});

//===================================================================

test('long pharmacy help can scroll and stays attached to a wrapping title', () => {
  const tooltip = read(
    '../../../../../packages/ui/src/overlays/InfoTooltip/InfoTooltip.tsx'
  );

  assert.match(help, /escapeOverflow\s+scrollable/);
  assert.match(tooltip, /maxHeight: floatingPosition\.maxHeight/);
  assert.match(tooltip, /setIsPinned\(true\)/);
  assert.match(tooltip, /event\.key !== 'Escape'/);

  assert.match(
    detail,
    /const pharmacyName = pharmacy\?\.name\.trim\(\) \|\| 'Pharmacy'/
  );

  assert.match(styles, /\.titleWithHelp\s*\{[^}]*display:\s*inline;/);
  assert.match(styles, /\.titleEnding\s*\{[^}]*white-space:\s*nowrap;/);
});

//===================================================================

test('Save changes uses the shared header action on all editable tabs', () => {
  const presentation = read(
    './OwnedPharmacyEditor/OwnedPharmacyEditorTabContent.tsx'
  );

  const documentPanel = read(
    '../../../../../packages/ui/src/profile/DocumentsPanel.tsx'
  );

  assert.match(editor, /createPortal\(headerAction, headerActionTarget\)/);
  assert.match(detail, /ref=\{setHeaderActionTarget\}/);
  assert.match(presentation, /suppressSectionHeading/);
  assert.match(documentPanel, /action=\{headerAction\}/);
  assert.doesNotMatch(styles, /\.sectionActions\s*\{[^}]*margin-top:/);

  assert.match(
    styles,
    /\.reviewItemHeading\s*\{[^}]*flex-direction:\s*column;/
  );

  assert.match(styles, /\.reviewItemHeading > button\s*\{\s*width:\s*100%/);
});

//===================================================================

test('moderation with one saved change uses required-field completeness, not re-verification', () => {
  assert.match(actions, /const hasChanges = moderationSummary\.length > 0/);

  assert.match(actions, /const moderationIncomplete =/);

  assert.match(
    actions,
    /disabled=\{\s*!needsModeration\s*\|\|\s*!hasChanges\s*\|\|\s*moderationIncomplete\s*\}/
  );

  assert.match(actions, /const verificationIncomplete =/);

  assert.match(
    actions,
    /disabled=\{\s*!needsVerification\s*\|\|\s*verificationIncomplete\s*\|\|\s*!ownerHasDocuments\s*\}/
  );

  assert.doesNotMatch(actions, /disabled=\{invalid \|\| !hasChanges\}/);
});
