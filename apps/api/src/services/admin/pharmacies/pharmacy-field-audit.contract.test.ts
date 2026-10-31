import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

// Keep these source-level checks compatible with both the ESM test loader
// and the CommonJS output produced by the API's Node16 tsconfig.
const apiRoot = existsSync(resolve(process.cwd(), 'apps/api/src'))
  ? resolve(process.cwd(), 'apps/api')
  : process.cwd();

//===============================================================

test('admin moderation records field-level snapshots while preserving retry idempotency', () => {
  const source = readFileSync(
    resolve(apiRoot, 'src/services/admin/pharmacies/admin.service.ts'),
    'utf8'
  );

  assert.match(
    source,
    /buildPharmacyAuditChanges\(pharmacy, saved, input\.action\)/
  );

  assert.match(source, /_moderationExpectedRevision: input\.expectedRevision/);
  assert.match(source, /_moderationAction: input\.action/);

  assert.match(
    source,
    /_moderationCommittedRevision: saved\.updatedAt\.toISOString\(\)/
  );

  assert.match(
    source,
    /audit\.before\._moderationExpectedRevision \?\? audit\.before\.revision/
  );

  assert.match(
    source,
    /audit\.after\._moderationCommittedRevision \?\? audit\.after\.revision/
  );

  assert.doesNotMatch(
    source,
    /changedFields: \['revision', 'moderationAction'/
  );
});

//===============================================================

test('owner moderation atomically changes status to on_moderation with pending review', () => {
  const source = readFileSync(
    resolve(apiRoot, 'src/services/pharmacies/pharmacy-moderation.service.ts'),
    'utf8'
  );

  const submit = source
    .split('export async function submitMyPharmacyModerationService')[1]
    ?.split('export async function sendMyPharmacyForVerificationService')[0];

  assert.ok(submit);
  assert.match(submit, /status: PHARMACY_STATUSES\.ON_MODERATION/);
  assert.match(submit, /reviewState: 'pending'/);
  assert.match(submit, /safePharmacyEditedSections\(/);
  assert.match(submit, /appendPharmacyOwnerMutationAudit\(/);
});
