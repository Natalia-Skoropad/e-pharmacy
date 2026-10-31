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
  assert.match(actions, /Cancel verification request/);

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

  assert.match(
    detail,
    /!\['data', 'about', 'payment', 'documents', 'comments'\]\.includes\(/
  );

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

  assert.match(editor, /headerAction=\{/);
  assert.match(presentation, /action=\{headerAction\}/);
  assert.match(presentation, /headerAction=\{headerAction\}/);
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
    /disabled=\{!needsModeration \|\| !hasChanges \|\| moderationIncomplete\}/
  );

  assert.match(actions, /const verificationIncomplete =/);

  assert.match(
    actions,
    /disabled=\{!needsVerification \|\| verificationIncomplete \|\| !ownerHasDocuments\}/
  );

  assert.doesNotMatch(actions, /disabled=\{invalid \|\| !hasChanges\}/);
});

//===================================================================

test('moderation summary uses the same icons as its pharmacy detail tabs', () => {
  assert.match(actions, /'Pharmacy data': ClipboardList/);
  assert.match(actions, /'About pharmacy': FileText/);
  assert.match(actions, /'Payment details': CreditCard/);
  assert.match(actions, /Documents: FileText/);

  assert.match(actions, /const Icon = MODERATION_TAB_ICONS\[group\.title\]/);

  assert.match(
    actions,
    /<span\s+className=\{css\.moderationTabIcon\}\s+aria-hidden="true"\s*>/
  );

  assert.match(actions, /<Icon size=\{18\} \/>/);
  assert.match(styles, /\.moderationSummary ul\s*\{[^}]*list-style:\s*none/);
  assert.match(styles, /\.moderationSummary li\s*\{[^}]*display:\s*grid/);
  assert.match(styles, /grid-template-columns:\s*36px minmax\(0, 1fr\)/);

  assert.match(
    styles,
    /\.moderationTabIcon\s*\{[^}]*color:\s*var\(--color-accent\)/
  );

  assert.match(
    styles,
    /\.moderationTabIcon\s*\{[^}]*background-color:\s*var\(--color-accent-light\)/
  );

  assert.match(styles, /\.moderationTabIcon\s*\{[^}]*border-radius:\s*50%/);
  assert.doesNotMatch(styles, /\.moderationSummary li span\s*\{/);
});
