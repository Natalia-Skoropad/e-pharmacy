import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

const read = (name: string) => readFile(new URL(name, import.meta.url), 'utf8');

//===================================================================

test('Inactive pharmacy overview does not repeat the blocked status reason', async () => {
  const source = await read(
    './OwnedPharmacyDetailPageContent/OwnedPharmacyInformationTab.tsx'
  );

  assert.doesNotMatch(source, /<Field label="Status reason">/);
  assert.match(source, /Pharmacy status activity/);
});

//===================================================================

test('Reactivation button uses its own mustard styling', async () => {
  const [actions, styles] = await Promise.all([
    read('./OwnedPharmacyDetailPageContent/OwnedPharmacyActions.tsx'),
    read(
      './OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.module.css'
    ),
  ]);

  assert.match(actions, /className=\{css\.reactivationAction\}/);

  assert.match(
    styles,
    /\.reactivationAction\s*\{[\s\S]*?background-color: #f4dea0/
  );
});

//===================================================================

test('Read-only internal notes survive Inactive; editing remains disabled', async () => {
  const source = await read(
    './OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
  );

  assert.match(
    source,
    /isEditable=\{Boolean\(pharmacy && pharmacy\.status !== 'blocked'\)\}/
  );
});

//===================================================================

test('Status dropdown stays beside a long title on desktop and tablet', async () => {
  const styles = await read(
    './OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.module.css'
  );

  assert.match(
    styles,
    /@media \(min-width: 768px\)[\s\S]*?grid-template-columns: minmax\(0, 1fr\) max-content/
  );
});

//===================================================================

test('Duplicate identifier confirmation scrolls the full dialog and shows at most two matches per field', async () => {
  const [modal, styles] = await Promise.all([
    read('./OwnedPharmacyEditor/DuplicateIdentifierSaveModal.tsx'),
    read('./OwnedPharmacyEditor/DuplicateIdentifierSaveModal.module.css'),
  ]);

  assert.match(modal, /dialogClassName=\{css\.scrollableDialog\}/);
  assert.match(modal, /className=\{css\.matchesList\}/);

  // A field shows two complete 54px cards separated by an 8px gap.
  assert.match(
    styles,
    /\.matchesList\s*\{[^}]*max-height:\s*116px;[^}]*overflow-y:\s*auto;/
  );

  // The whole dialog (including its action buttons) must scroll on short viewports.
  // Merely finding overflow-y:auto on a nested match list is insufficient.
  assert.match(
    styles,
    /\.scrollableDialog\s*\{[^}]*max-height:\s*calc\(100dvh - 40px\);[^}]*overflow-y:\s*auto;/
  );

  assert.doesNotMatch(
    styles,
    /\.scrollableDialog\s*\{[^}]*overflow:\s*hidden;/
  );
});
