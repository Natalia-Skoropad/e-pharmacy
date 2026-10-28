import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

const deactivation = read('./pharmacy-owner-deactivation.service.ts');
const discard = read('./pharmacy-owner-pending-discard.service.ts');
const routes = read('../../routes/pharmacies/pharmacy.routes.ts');
const documents = read('./pharmacy-document.service.ts');

//===============================================================

test('deactivation eligibility and mutation check the same unfinished work predicates', () => {
  assert.match(deactivation, /async function countUnfinishedPharmacyWork/);
  assert.match(deactivation, /PHARMACY_OWNER_ACTIVE_ORDER_STATUSES/);
  assert.match(deactivation, /\['draft', 'new', 'in_progress'\]/);

  assert.match(
    deactivation,
    /countUnfinishedPharmacyWork\(pharmacy\._id, session\)/
  );

  assert.match(deactivation, /membershipRole !== 'owner'/);
  assert.match(deactivation, /appendAdminAuditLog/);
});

//===============================================================

test('only unsubmitted individual changes are removable with revision and audit', () => {
  assert.match(discard, /membershipRole !== 'owner'/);
  assert.match(discard, /reviewState === 'changes_requested'/);
  assert.match(discard, /updatedAt: pharmacy\.updatedAt/);
  assert.match(discard, /input\.field in nested/);
  assert.match(discard, /reconcileAttachedPharmacyDocumentStorage/);
  assert.match(discard, /appendPharmacyOwnerMutationAudit/);
  assert.match(routes, /'\/me\/pharmacies\/:pharmacyId\/pending-changes'/);

  assert.match(
    routes,
    /'\/me\/pharmacies\/:pharmacyId\/deactivation-eligibility'/
  );
});

//===============================================================

test('saving attachments preserves trusted legacy pharmacy documents but rejects foreign IDs', () => {
  assert.match(documents, /Pharmacy\.findById\(pharmacyId\)/);
  assert.match(documents, /'documents pendingModeration\.documents'/);
  assert.match(documents, /trustedAttached\.get\(id\)/);
  assert.match(documents, /!uploaded && !attached/);
  assert.match(documents, /selectableDocumentFilter/);
});
