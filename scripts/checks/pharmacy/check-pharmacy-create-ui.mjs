import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

//===================================================================

const read = (relative) => readFileSync(resolve(relative), 'utf8');
const routes = read('apps/api/src/routes/pharmacy.routes.ts');
const controller = read('apps/api/src/controllers/pharmacy.controller.ts');
const member = read('apps/api/src/services/pharmacy-membership.service.ts');

const boundary = read(
  'apps/pharmacy/src/components/layout/PharmacyShell/PharmacyCabinetBoundary.tsx'
);

const profile = read('apps/api/src/services/pharmacy.service.ts');
const upload = read('apps/api/src/services/pharmacy-document.service.ts');
const draftSchema = read('apps/api/src/schemas/pharmacy.schema.ts');
const createService = read('apps/api/src/services/pharmacy-create.service.ts');

const editor = read(
  'apps/pharmacy/src/components/pharmacies/OwnedPharmacyEditor/OwnedPharmacyEditor.tsx'
);

const fields = read(
  'apps/pharmacy/src/components/pharmacies/OwnedPharmacyEditor/pharmacy-editor-fields.ts'
);

const browser = read(
  'apps/pharmacy/src/lib/api/browser/owned-pharmacy-editor.api.ts'
);

const list = read(
  'apps/pharmacy/src/components/pharmacies/OwnedPharmaciesPageContent/OwnedPharmaciesPageContent.tsx'
);

const detail = read(
  'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
);

//===================================================================

assert.ok(existsSync('apps/pharmacy/src/app/pharmacy/pharmacies/new/page.tsx'));
assert.match(routes, /'\/me\/pharmacies\/:pharmacyId\/profile'/);
assert.match(routes, /'\/me\/pharmacies\/:pharmacyId\/documents'/);
assert.match(routes, /'\/me\/pharmacies\/:pharmacyId\/send-for-verification'/);

assert.match(
  routes,
  /validate\(\{ params: ownedPharmacyRegistryParamsSchema, body: updateMyPharmacyProfileSchema \}\)/
);

assert.match(
  controller,
  /updateMyPharmacyProfileService\([\s\S]*?res\.locals\.validated\.params\.pharmacyId/
);

assert.match(
  controller,
  /sendMyPharmacyForVerificationService\([\s\S]*?res\.locals\.validated\.params\.pharmacyId/
);

assert.match(
  boundary,
  /pathname\?\.startsWith\(`\$\{PHARMACY_ROUTES\.PHARMACIES\}\/`\)/
);

assert.match(
  member,
  /requirePharmacyCapability\(userId, capability, \{ session, pharmacyId \}\)/
);

assert.match(profile, /'submit_profile',\s*session,\s*pharmacyId/);
assert.match(profile, /'edit_profile',\s*mongoSession,\s*pharmacyId/);
assert.match(profile, /assertReadyForVerification\(pharmacy\)/);
assert.match(profile, /PharmacyOwnerDocument\.exists/);
assert.match(upload, /'manage_documents',\s*undefined,\s*pharmacyId/);

const createSchema = draftSchema
  .split('export const createPharmacyDraftSchema')[1]
  .split('export const updateMyPharmacyProfileSchema')[0];

assert.match(createSchema, /name: sharedPharmacyNameSchema\.optional\(\)/);
assert.match(createService, /removeEmptyFields\(editable\) \?\? \{\}/);
assert.match(browser, /localApiRequest/);
assert.doesNotMatch(browser, /\/admin\/|ownerId:/);
assert.match(editor, /useRef<string \| null>\(null\)/);
assert.match(editor, /crypto\.randomUUID\(\)/);
assert.match(editor, /getMyPharmacyOwnerDocuments/);

assert.match(
  editor,
  /validatePharmacyEditor\(values, documents\.length, 'draft'\)/
);

assert.match(editor, /validatePharmacyEditor\(values, documents\.length\)/);
assert.match(editor, /beforeunload/);
assert.match(editor, /popstate/);
assert.match(editor, /confirm\('You have unsaved pharmacy changes/);
assert.match(editor, /<WorkingHoursInput/);
assert.match(editor, /uploadOwnedPharmacyDocument/);
assert.match(editor, /router\.replace\(getOwnedPharmacyPath/);
assert.match(fields, /validatePharmacyContactForm\(values, mode\)/);
assert.match(fields, /validatePharmacyAboutForm\(values, mode\)/);
assert.match(fields, /validatePharmacyPaymentForm\(values, mode\)/);
assert.match(fields, /buildPictureUrlError/);
assert.match(list, /router\.push\(`\$\{PHARMACY_ROUTES\.PHARMACIES\}\/new`\)/);
assert.match(detail, /<OwnedPharmacyEditor pharmacyId=\{pharmacyId\}/);

console.log('Stage 14.18.10 scoped draft UI contracts passed.');
