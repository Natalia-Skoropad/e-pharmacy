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

test('Duplicate identifier confirmation can scroll to its action buttons', async () => {
  const [modal, styles] = await Promise.all([
    read('./OwnedPharmacyEditor/DuplicateIdentifierSaveModal.tsx'),
    read('./OwnedPharmacyEditor/DuplicateIdentifierSaveModal.module.css'),
  ]);

  assert.match(modal, /dialogClassName=\{css\.scrollableDialog\}/);
  assert.match(styles, /max-height: calc\(100dvh - 32px\)/);
  assert.match(styles, /overflow-y: auto/);
});
