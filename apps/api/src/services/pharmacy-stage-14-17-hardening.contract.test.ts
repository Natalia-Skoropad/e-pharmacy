import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

// Stage 14.17 guards the existing domains without introducing Stage 15 routes.
const read = (path: string) =>
  readFile(resolve(process.cwd(), 'src', path), 'utf8');

//===================================================================

test('14.17: first activation accepts new (not blocked) owners and provisions a default client once', async () => {
  const [decisions, lifecycle, defaultClient] = await Promise.all([
    read('services/admin.service.ts'),
    read('services/pharmacy-owner-lifecycle.service.ts'),
    read('services/default-pharmacy-client.service.ts'),
  ]);

  assert.match(decisions, /owner\.status === USER_STATUSES\.BLOCKED/);

  assert.match(
    decisions,
    /if \(!pharmacy\.activatedAt\) \{[\s\S]*?ensureDefaultPharmacyClient\([\s\S]*?activateNewPharmacyOwnerForPharmacy\(/
  );

  assert.match(lifecycle, /USER_STATUSES\.NEW/);

  assert.match(
    defaultClient,
    /isDefaultPharmacyClient: true,[\s\S]*?defaultClientPharmacyId: pharmacy\._id/
  );

  assert.match(
    defaultClient,
    /\$setOnInsert: \{[\s\S]*?favoriteProductIds: \[\],[\s\S]*?favoritePharmacyIds: \[\]/
  );

  assert.doesNotMatch(defaultClient, /\$set: \{\s*favoriteProductIds:/);
  assert.doesNotMatch(defaultClient, /\$set: \{\s*createdAt:/);
});

//===================================================================

test('14.17: correction cycles are same-status, separately audited and CAS-protected', async () => {
  const [decisions, owner] = await Promise.all([
    read('services/admin.service.ts'),
    read('services/pharmacy.service.ts'),
  ]);

  const corrections =
    decisions
      .split("case 'request_corrections':")[1]
      ?.split("case 'approve':")[0] ?? '';

  assert.match(corrections, /!isVerification && !isModeration/);
  assert.match(corrections, /nextUpdate\.reviewState = nextReviewState/);
  assert.match(corrections, /nextUpdate\.reviewFeedback = reason/);
  assert.doesNotMatch(corrections, /nextUpdate\.status\s*=/);

  assert.match(
    decisions,
    /Math\.max\(Date\.now\(\), pharmacy\.updatedAt\.getTime\(\) \+ 1\)/
  );

  assert.match(decisions, /updatedAt: expectedDate/);
  assert.match(decisions, /await appendAdminAuditLog\(/);
  assert.match(owner, /isResubmission[\s\S]*?reviewState: 'pending'/);
});

//===================================================================

test('14.17: approving a pending draft is atomic and does not rewrite first activation date', async () => {
  const [decisions, documents] = await Promise.all([
    read('services/admin.service.ts'),
    read('services/pharmacy-document.service.ts'),
  ]);

  assert.match(decisions, /session\.withTransaction/);
  assert.match(decisions, /activatedAt: pharmacy\.activatedAt \?\? approvedAt/);

  assert.match(
    decisions,
    /normalizePendingModeration\(pharmacy\.pendingModeration\)/
  );

  assert.match(decisions, /unsetFields\.pendingModeration = ''/);
  assert.match(decisions, /reconcileAttachedPharmacyDocumentStorage\(/);
  assert.match(documents, /attachedAt/);
});

//===================================================================

test('14.17: blocking respects in-progress orders and reactivation never skips verification', async () => {
  const [decisions, statuses] = await Promise.all([
    read('services/admin.service.ts'),
    read('constants/pharmacy-owner-lifecycle.ts'),
  ]);

  assert.match(statuses, /'new'/);
  assert.match(statuses, /'in_progress'/);

  assert.match(
    decisions,
    /assertPharmacyHasNoActiveOrders\(pharmacy\._id, session\)/
  );

  assert.match(decisions, /nextUpdate\.statusReason = reason/);

  const reactivation =
    decisions
      .split("case 'review_reactivation':")[1]
      ?.split('// Strict CAS')[0] ?? '';

  assert.match(reactivation, /assertPharmacyOwnerCanOperate/);
  assert.match(reactivation, /PHARMACY_STATUSES\.ON_VERIFICATION/);
  assert.doesNotMatch(reactivation, /PHARMACY_STATUSES\.ON_MODERATION/);
});

//===================================================================

test('14.17: registry ratings use real-value contiguous buckets and AND all filters before paging', async () => {
  const registry = await read(
    'services/admin-pharmacy-registry-read.service.ts'
  );

  const bounds = [
    ...registry.matchAll(
      /'([0-5]-[0-9.]+)': \{ min: (\d), max: (\d), inclusiveMax: (true|false) \}/g
    ),
  ].map((match) => ({
    name: match[1]!,
    min: Number(match[2]),
    max: Number(match[3]),
    maxInclusive: match[4] === 'true',
  }));

  assert.equal(bounds.length, 5);

  for (const value of [0, 0.95, 1, 1.95, 3.95, 4, 5]) {
    const matches = bounds.filter(
      ({ min, max, maxInclusive }) =>
        value >= min && (value < max || (maxInclusive && value === max))
    );

    assert.equal(
      matches.length,
      1,
      `Rating ${value} must match exactly one bucket`
    );
  }

  assert.match(registry, /match\.\$or = identitySearch\(query\.pharmacySearch/);
  assert.match(registry, /ownerSearchStages\(query\.ownerSearch\)/);
  assert.match(registry, /if \(query\.status\) match\.status/);
  assert.match(registry, /if \(query\.createdFrom \|\| query\.createdTo\)/);
  assert.match(registry, /safePage !== page/);
});

//===================================================================

test('14.17: pharmacy-scoped activity cannot leak another pharmacy from the same owner', async () => {
  const [activity, audit] = await Promise.all([
    read('services/admin-pharmacy-activity.service.ts'),
    read('services/admin-audit.service.ts'),
  ]);

  assert.match(
    activity,
    /listAdminAuditLogsService\(query, \{ pharmacyId \}\)/
  );

  assert.match(activity, /listAdminAuditActorsService\(\{ pharmacyId \}\)/);

  assert.match(
    activity,
    /getAdminAuditLogService\(auditLogId, \{ pharmacyId \}\)/
  );

  const scope =
    audit
      .split('export function buildPharmacyAuditScopeFilter(')[1]
      ?.split(
        '//==============================================================='
      )[0] ?? '';

  assert.match(scope, /pharmacyId: id/);
  assert.match(scope, /entityId: id/);
  assert.match(scope, /scopeEntityId: id/);
  assert.doesNotMatch(scope, /PHARMACY_OWNER/);
  assert.match(audit, /filter\.\$and = \[exactPharmacyFilter\]/);
});

//===================================================================

test('14.17: view permission is read-only for moderation even through direct API calls', async () => {
  const routes = await read('routes/admin.routes.ts');

  for (const path of [
    '/pharmacies/:pharmacyId/moderation-decisions',
    '/pharmacies/:pharmacyId/status',
    '/pharmacies/:pharmacyId/review/corrections',
  ]) {
    const index = routes.indexOf(`'${path}'`);

    assert.ok(index > 0, `${path} must have its own route`);

    assert.match(
      routes.slice(index, index + 230),
      /ADMIN_PERMISSIONS\.pharmacies\.moderate/
    );
  }

  assert.match(routes, /authorizeRoles\(USER_ROLES\.ADMIN\)/);

  assert.doesNotMatch(
    routes,
    /adminRoutes\.(?:post|put|patch|delete)\(\s*'\/pharmacies\/:pharmacyId\/documents/
  );
});

//===================================================================

test('14.17: document ownership and Admin comments are isolated from Owner/Pharmacy notes', async () => {
  const [documents, comments, commentModel, pharmacyRoutes, ownerRoutes] =
    await Promise.all([
      read('services/pharmacy-document.service.ts'),
      read('services/pharmacy-admin-comment.service.ts'),
      read('models/pharmacyAdminComment.model.ts'),
      read('routes/pharmacy.routes.ts'),
      read('routes/pharmacy-owner.routes.ts'),
    ]);

  assert.match(documents, /getPharmacyDocumentReferences\(pharmacyId\)/);
  assert.match(documents, /attachedAt:\s*\{\s*\$exists:\s*true\s*\}/);
  assert.match(documents, /pharmacyId, \/\/ never trust documentId alone/);
  assert.match(comments, /assertReplayMatches\(existing, pharmacyId, text\)/);
  assert.match(comments, /scopeEntityId: pharmacyId/);

  assert.doesNotMatch(
    comments
      .split('function auditMetadata(')[1]
      ?.split('const auditFields')[0] ?? '',
    /text: comment\.text/
  );

  assert.match(
    commentModel,
    /createdByAdminUserId: 1, clientRequestId: 1 \}, \{ unique: true \}/
  );

  assert.doesNotMatch(pharmacyRoutes + ownerRoutes, /PharmacyAdminComment/);
});

//===================================================================

test('14.17: audit and default-client indexes are safe on repeated deployment', async () => {
  const [audit, user, comment] = await Promise.all([
    read('models/adminAuditLog.model.ts'),
    read('models/user.model.ts'),
    read('models/pharmacyAdminComment.model.ts'),
  ]);

  assert.match(audit, /name: 'audit_entity_mutation_key_unique'/);
  assert.match(audit, /name: 'audit_pharmacy_activity'/);

  assert.match(
    audit,
    /partialFilterExpression: \{ mutationKey: \{ \$type: 'string' \} \}/
  );

  assert.match(
    user,
    /unique: true,[\s\S]*?partialFilterExpression: \{ isDefaultPharmacyClient: true \}/
  );

  assert.match(comment, /unique: true/);
});
