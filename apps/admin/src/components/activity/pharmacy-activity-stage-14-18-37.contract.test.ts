import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (relative: string) =>
  readFileSync(new URL(relative, import.meta.url), 'utf8');

//===================================================================

test('14.18.37 pharmacy actor selection reuses global actor profiles for exact-scoped IDs', () => {
  const service = read(
    '../../../../api/src/services/admin/audit/admin-audit-actors.service.ts'
  );

  assert.match(
    service,
    /AdminAuditLog\.distinct\(\s*'actorUserId',\s*buildPharmacyAuditScopeFilter\(exactScope\.pharmacyId\)/
  );

  assert.match(service, /actorUserId:\s*\{\s*\$in:\s*scopedActorIds/);

  assert.match(
    service,
    /if \(scopedActorIds && scopedActorIds\.length === 0\) return \{ items: \[\] \}/
  );

  assert.match(service, /AdminAuditLog\.aggregate/);
  assert.match(service, /pictureUrl: user\.pictureUrl/);
});

//===================================================================

test('14.18.37 pharmacy-specific activity retains pharmacy-owner actor URL filter', () => {
  const page = read('../../app/admin/pharmacies/[...filters]/page.tsx');
  const history = read('./ActivityHistory.tsx');

  assert.match(
    page,
    /const initialActivityState = parseAdminActivityUrl\(route\.activitySegments\)/
  );

  assert.doesNotMatch(page, /ownerUserId: ''/);
  assert.match(history, /getAdminPharmacyActivity\(scopePharmacyId/);
  assert.match(history, /getAdminPharmacyActivityDetail\(scopePharmacyId/);
});

//===================================================================

test('14.18.37 historical audit snapshots are serialized without mutating audit rows', () => {
  const projection = read(
    '../../../../api/src/services/admin/audit/admin-audit-projection.ts'
  );

  assert.match(projection, /function serializeAuditSnapshot/);
  assert.match(projection, /before: serializeAuditSnapshot\(log\.before\)/);
  assert.match(projection, /after: serializeAuditSnapshot\(log\.after\)/);
  assert.match(projection, /JSON\.stringify\(value\)/);
  assert.doesNotMatch(projection, /log\.before\s*=/);
});
