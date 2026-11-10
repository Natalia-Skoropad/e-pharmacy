import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const editor = readFileSync(
  new URL('./OwnedPharmacyEditor.tsx', import.meta.url),
  'utf8'
);

const fields = readFileSync(
  new URL('./pharmacy-editor-fields.ts', import.meta.url),
  'utf8'
);

const schema = readFileSync(
  new URL(
    '../../../../../api/src/schemas/pharmacies/pharmacy.schema.ts',
    import.meta.url
  ),
  'utf8'
);

//===================================================================

test('creation requires a valid named pharmacy before draft saving', () => {
  assert.match(fields, /NEW_PHARMACY_NAME_MIN_LENGTH = 10/);

  assert.match(
    fields,
    /if \(!name\)\s*\{\s*errors.name = 'Pharmacy name is required'/
  );

  assert.match(
    fields,
    /isNewPharmacy && name.length < NEW_PHARMACY_NAME_MIN_LENGTH/
  );

  assert.match(editor, /'draft',\s*!pharmacyId/);

  assert.match(
    editor,
    /const canSaveDraft\s*=\s*Object\.keys\(draftFieldErrors\)\.length\s*===\s*0\s*&&\s*!paymentAvailability\.blocked\s*&&\s*\(\s*hasSavedDraft\s*\|\|\s*values\.name\.trim\(\)\.length\s*>=\s*NEW_PHARMACY_NAME_MIN_LENGTH\s*\)/
  );

  assert.match(
    editor,
    /disabled=\{\s*busy !== null\s*\|\|\s*!canSaveDraft\s*\|\|\s*\(hasSavedDraft && !isDirty\)\s*\}/
  );

  assert.match(
    editor,
    /'Enter a pharmacy name of at least 10 characters to save your draft/
  );

  const createSchema = schema.slice(
    schema.indexOf('export const createPharmacyDraftSchema'),
    schema.indexOf('export const updateMyPharmacyProfileSchema')
  );

  assert.match(
    createSchema,
    /name:\s*sharedPharmacyNameSchema\.min\(\s*10,\s*'Pharmacy name must be at least 10 characters'\s*\)/
  );

  assert.doesNotMatch(
    createSchema,
    /name: sharedPharmacyNameSchema\.optional\(\)/
  );

  assert.match(
    schema,
    /const pharmacyProfileUpdateChangesSchema =[\s\S]*?name: sharedPharmacyNameSchema\.optional\(\)/
  );
});
