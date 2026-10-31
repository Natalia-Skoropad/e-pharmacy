import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

//===================================================================

const read = (relative) => readFileSync(resolve(relative), 'utf8');
const routes = read('apps/api/src/routes/pharmacies/pharmacy.routes.ts');

const controller = read(
  'apps/api/src/controllers/pharmacies/pharmacy.controller.ts'
);

const member = read(
  'apps/api/src/services/pharmacies/pharmacy-membership.service.ts'
);

const boundary = read(
  'apps/pharmacy/src/components/layout/PharmacyShell/PharmacyCabinetBoundary.tsx'
);

const profile = read(
  'apps/api/src/services/pharmacies/pharmacy-moderation.service.ts'
);

const ownerProfile = read(
  'apps/api/src/services/pharmacies/pharmacy-owner-profile.service.ts'
);

const upload = read(
  'apps/api/src/services/pharmacies/pharmacy-document.service.ts'
);

const draftSchema = read('apps/api/src/schemas/pharmacies/pharmacy.schema.ts');

const createService = read(
  'apps/api/src/services/pharmacies/pharmacy-create.service.ts'
);

const editor = read(
  'apps/pharmacy/src/components/pharmacies/OwnedPharmacyEditor/OwnedPharmacyEditor.tsx'
);

const navigationGuard = read(
  'apps/pharmacy/src/components/pharmacies/OwnedPharmacyEditor/useUnsavedPharmacyNavigation.ts'
);

const editorTabs = read(
  'apps/pharmacy/src/components/pharmacies/OwnedPharmacyEditor/OwnedPharmacyEditorTabContent.tsx'
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

//===================================================================

// Match the specific scoped PATCH route, not a single formatting of validate().
// A global schema-name match could pass even if a different route used it.
const scopedProfilePatch = routes.match(
  /pharmacyRoutes\.patch\(\s*'\/me\/pharmacies\/:pharmacyId\/profile',([\s\S]*?)\n\);/
);

assert.ok(scopedProfilePatch, 'Missing pharmacyId-scoped draft PATCH route.');
assert.match(scopedProfilePatch[1], /authenticate/);
assert.match(scopedProfilePatch[1], /authorizeRoles\(USER_ROLES\.PHARMACY\)/);

assert.match(
  scopedProfilePatch[1],
  /validate\(\{\s*params:\s*ownedPharmacyRegistryParamsSchema,\s*body:\s*updateMyPharmacyProfileSchema,?\s*\}\)/
);

assert.match(scopedProfilePatch[1], /ctrlWrapper\(updateOwnedPharmacyDraft\)/);

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
  /requirePharmacyCapability\(\s*userId,\s*capability,\s*\{\s*session,\s*pharmacyId,\s*allowBlocked:\s*true,?\s*\}\s*\)/
);

assert.match(profile, /'submit_profile',\s*session,\s*pharmacyId/);
assert.match(ownerProfile, /'edit_profile',\s*mongoSession,\s*pharmacyId/);
assert.match(profile, /assertReadyForVerification\(pharmacy\)/);
assert.match(profile, /PharmacyOwnerDocument\.exists/);
assert.match(upload, /'manage_documents',\s*undefined,\s*pharmacyId/);

const createSchema = draftSchema
  .split('export const createPharmacyDraftSchema')[1]
  .split('export const updateMyPharmacyProfileSchema')[0];

assert.match(
  createSchema,
  /name: sharedPharmacyNameSchema\.min\(\s*10,/,
  'New pharmacy draft must require a name with at least 10 characters.'
);

assert.match(createService, /removeEmptyFields\(editable\) \?\? \{\}/);
assert.match(browser, /localApiRequest/);
assert.doesNotMatch(browser, /\/admin\/|ownerId:/);
assert.match(editor, /useRef<string \| null>\(null\)/);
assert.match(editor, /crypto\.randomUUID\(\)/);

//===================================================================

// Owner document readiness is checked by the saved pharmacy status action,
// not by the draft-only Create pharmacy editor.
const ownerActions = read(
  'apps/pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyActions.tsx'
);

assert.match(ownerActions, /getMyPharmacyOwnerDocuments/);

assert.match(
  editor,
  /validatePharmacyEditor\(\s*values,\s*documents\.length,\s*'draft',\s*!pharmacyId\s*\)/
);

assert.match(navigationGuard, /addEventListener\(['"]beforeunload['"]/);

assert.match(navigationGuard, /popstate/);
assert.match(editor, /<ConfirmationModal/);
assert.match(editor, /isOpen=\{leaveDialogOpen\}/);
assert.match(editor, /pendingNavigationRef\.current/);
assert.match(editorTabs, /<WorkingHoursInput/);
assert.match(editor, /uploadOwnedPharmacyDocument/);
assert.match(editor, /router\.replace\(getOwnedPharmacyPath/);

assert.match(
  editor,
  /values\.name\.trim\(\)\.length >= NEW_PHARMACY_NAME_MIN_LENGTH/
);

assert.match(fields, /validatePharmacyContactForm\(values, mode\)/);
assert.match(fields, /validatePharmacyAboutForm\(values, mode\)/);
assert.match(fields, /validatePharmacyPaymentForm\(values, mode\)/);
assert.match(fields, /buildPictureUrlError/);
assert.match(list, /router\.push\(`\$\{PHARMACY_ROUTES\.PHARMACIES\}\/new`\)/);

//===================================================================

// Saved pharmacy edits reuse the canonical tab fields without mounting the
// create-only editor on the pharmacy details page.
assert.match(detail, /<OwnedPharmacyEditableTab/);

//===================================================================

console.log('Stage 14.18.10 scoped draft UI contracts passed.');
