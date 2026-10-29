import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';
import type { ISODateTimeString } from '@e-pharmacy/types/primitives';

import {
  getPharmacyModerationOptions,
  validatePharmacyModerationReason,
  PHARMACY_MODERATION_REASON_MAX_LENGTH,
} from '../../lib/pharmacies/pharmacy-moderation-actions';

//===================================================================

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');
const REV = '2026-10-12T09:10:00.000Z' as ISODateTimeString;

//===================================================================

function pharmacy(
  status: AdminPharmacyDetail['status'],
  ownerStatus: 'new' | 'active' | 'blocked' | null = 'active',
  reviewState: AdminPharmacyDetail['reviewState'] = 'pending',
  wasActivated = true,
  blockSource?: AdminPharmacyDetail['blockSource']
): AdminPharmacyDetail {
  return {
    id: '507f1f77bcf86cd799439011',
    status,
    ...(blockSource ? { blockSource } : {}),

    owner: ownerStatus
      ? {
          id: '507f1f77bcf86cd799439012',
          name: 'Owner',
          email: 'owner@example.test',
          phone: '123456789',
          status: ownerStatus,
        }
      : null,

    current: { name: 'Pharmacy', bankTransferAvailable: false },
    reviewState,

    dates: {
      createdAt: REV,
      updatedAt: REV,
      ...(wasActivated ? { activatedAt: REV } : {}),
    },

    documentCount: 0,

    metrics: {
      activeClientsCount: 0,
      successfulOrdersCount: 0,
      successfulRevenue: 0,
      addedProductsCount: 0,
      rating: 0,
      reviewsCount: 0,
    },
  };
}

//===================================================================

const actions = (detail: AdminPharmacyDetail) =>
  getPharmacyModerationOptions(detail).map((entry) => entry.action);

//===================================================================

test('14.14: canonical transition matrix gates review decisions and emergency blocking', () => {
  for (const review of ['pending', 'changes_requested'] as const) {
    for (const owner of ['new', 'active', 'blocked', null] as const) {
      const ownerCanOperate = owner === 'active' || owner === 'new';

      assert.deepEqual(actions(pharmacy('new', owner, review)), []);
      assert.deepEqual(actions(pharmacy('active', owner, review)), ['block']);

      for (const status of ['on_verification', 'on_moderation'] as const) {
        assert.deepEqual(
          actions(pharmacy(status, owner, review)),

          review === 'changes_requested'
            ? ['block'] // Only the emergency Admin action remains available.
            : ownerCanOperate
              ? ['approve', 'request_corrections', 'block']
              : ['request_corrections', 'block']
        );
      }

      assert.deepEqual(
        actions(pharmacy('on_reactivation', owner, review)),

        review === 'changes_requested'
          ? [] // Admin awaits the owner's corrected resubmission.
          : ownerCanOperate
            ? [
                'review_reactivation',
                'request_corrections',
                'reject_reactivation',
              ]
            : ['request_corrections', 'reject_reactivation']
      );

      // An Owner-initiated deactivation must not be overridden by Admin.
      assert.deepEqual(actions(pharmacy('blocked', owner, review)), []);

      assert.deepEqual(
        actions(pharmacy('blocked', owner, review, true, 'owner_deactivated')),
        []
      );

      assert.deepEqual(
        actions(pharmacy('blocked', owner, review, true, 'admin_blocked')),
        ownerCanOperate ? ['review_reactivation'] : []
      );
    }
  }
});

//===================================================================

test('14.14: corrections are explicit audited same-status decisions, not status PATCH', () => {
  for (const status of ['on_verification', 'on_moderation'] as const) {
    const corrections = getPharmacyModerationOptions(pharmacy(status)).find(
      ({ action }) => action === 'request_corrections'
    );

    assert.ok(corrections);
    assert.equal(corrections.targetStatus, status);
    assert.equal(corrections.feedbackVisibleToOwner, true);
    assert.equal(corrections.danger, false);
  }

  assert.equal(
    getPharmacyModerationOptions(pharmacy('on_moderation'))[0]?.label,
    'Approve changes'
  );

  assert.equal(
    getPharmacyModerationOptions(pharmacy('on_verification'))[0]?.label,
    'Approve & activate'
  );
});

//===================================================================

test('14.14: reactivation never silently enters operational moderation or publishes pending drafts', () => {
  const previouslyActive = getPharmacyModerationOptions(
    pharmacy('blocked', 'active', 'pending', true, 'admin_blocked')
  );

  assert.equal(previouslyActive[0]?.targetStatus, 'active');

  assert.match(
    previouslyActive[0]?.description ?? '',
    /pending drafts are not published/
  );

  const neverActivated = getPharmacyModerationOptions(
    pharmacy('blocked', 'active', 'pending', false, 'admin_blocked')
  );

  assert.equal(neverActivated[0]?.targetStatus, 'on_verification');

  assert.ok(
    !neverActivated.some((action) => action.targetStatus === 'on_moderation')
  );

  const submittedReactivation = getPharmacyModerationOptions(
    pharmacy('on_reactivation', 'active', 'pending', false)
  );

  assert.equal(submittedReactivation[0]?.action, 'review_reactivation');
  assert.equal(submittedReactivation[0]?.targetStatus, 'on_verification');

  assert.deepEqual(
    submittedReactivation.map(({ action }) => action),
    ['review_reactivation', 'request_corrections', 'reject_reactivation']
  );

  assert.deepEqual(
    actions(pharmacy('on_reactivation', 'active', 'changes_requested')),
    []
  );
});

//===================================================================

test('14.14: reason matches server mandatory 1..1000 trimmed limit', () => {
  assert.equal(validatePharmacyModerationReason(' '), 'Reason is required.');
  assert.equal(validatePharmacyModerationReason(' Reason '), '');
  assert.equal(validatePharmacyModerationReason('x'.repeat(1000)), '');
  assert.match(validatePharmacyModerationReason('x'.repeat(1001)), /1000/);
  assert.equal(PHARMACY_MODERATION_REASON_MAX_LENGTH, 1000);
});

//===================================================================

test('14.14: permission, idempotency, CAS, owner feedback, refresh, audit and shared modal are wired', async () => {
  const detail = await read(
    './PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'
  );

  const actionsSource = await read(
    './PharmacyDetailsPageContent/PharmacyModerationActions.tsx'
  );

  // Stage 14.18 moved pharmacy-scoped moderation and owner feedback out of
  // the owner's personal profile and into the selected pharmacy's detail page.
  const ownedPharmacyDetail = await read(
    '../../../../pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
  );

  // After the owner-detail decomposition, status/feedback fields live in the
  // canonical information tab rather than its page-level data loader.
  const ownedPharmacyInformation = await read(
    '../../../../pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyInformationTab.tsx'
  );

  const ownedPharmacyActions = await read(
    '../../../../pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyActions.tsx'
  );

  const ownedPharmacyReview = await read(
    '../../../../pharmacy/src/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacySectionReview.tsx'
  );

  const pharmacyStatusPresentation = await read(
    '../../../../../packages/config/src/presentation/pharmacies.ts'
  );

  const backend = await read(
    '../../../../api/src/services/admin/pharmacies/admin.service.ts'
  );

  const schema = await read(
    '../../../../api/src/schemas/admin/admin.schema.ts'
  );

  const sharedModal = await read(
    '../../../../../packages/ui/src/overlays/ReasonModal/ReasonModal.tsx'
  );

  const registry = await read(
    './PharmaciesPageContent/PharmaciesPageContent.tsx'
  );

  const linked = await read(
    '../pharmacy-owners/PharmacyOwnerDetailsPageContent/LinkedPharmaciesTab.tsx'
  );

  assert.match(
    detail,
    /canAdmin\(access, ADMIN_PERMISSIONS\.pharmacies\.moderate\)/
  );

  assert.match(detail, /detail && canModerate/);
  assert.match(detail, /<PharmacyModerationActions/);
  assert.doesNotMatch(detail, /Status management is not available yet/);
  assert.match(actionsSource, /<ReasonModal/);
  assert.match(actionsSource, /decideAdminPharmacyModeration\(/);
  assert.match(actionsSource, /expectedRevision: action\.expectedRevision/);
  assert.match(actionsSource, /clientRequestId: action\.clientRequestId/);
  assert.match(actionsSource, /crypto\.randomUUID\(\)/);
  assert.match(actionsSource, /requestPharmacyModerationRefresh\(\)/);
  assert.match(actionsSource, /requestPharmacyOwnerNavigationBadgeRefresh\(\)/);
  assert.match(actionsSource, /onDetailRefreshed\(fresh\)/);

  assert.match(
    actionsSource,
    /action\.option\.action === 'request_corrections'/
  );

  assert.match(
    actionsSource,
    /status unchanged; a new review decision is audited/
  );

  assert.match(actionsSource, /unfinished orders/);
  assert.match(actionsSource, /The owner will see this reason/);
  assert.match(sharedModal, /required/);

  // Review state is shown alongside the status, not by replacing the badge.
  assert.match(ownedPharmacyInformation, /<Field label="Pharmacy status">/);

  assert.match(
    ownedPharmacyInformation,
    /<StatusBadge \{\.\.\.PHARMACY_STATUS_PRESENTATION\[pharmacy\.status\]\} \/>/
  );

  assert.match(
    ownedPharmacyInformation,
    /pharmacy\.reviewState === 'changes_requested'/
  );

  assert.match(ownedPharmacyInformation, /Needs changes/);
  assert.match(ownedPharmacyInformation, /Pharmacy status activity/);

  assert.match(
    pharmacyStatusPresentation,
    /blocked:\s*\{\s*label: 'Inactive',\s*tone: 'danger'\s*\}/
  );

  assert.match(ownedPharmacyReview, /pharmacy\.reviewFeedback/);
  assert.match(ownedPharmacyInformation, /<Field label="Status reason">/);
  assert.match(ownedPharmacyInformation, /show\(pharmacy\.statusReason\)/);

  // Owner actions moved into their own component. Pending reviews do not
  // offer Cancel; the Needs changes state restores owner actions.
  assert.match(ownedPharmacyDetail, /<OwnedPharmacyActions/);
  assert.match(ownedPharmacyActions, /const needsVerification\s*=/);
  assert.match(ownedPharmacyActions, /const needsModeration\s*=/);
  assert.match(ownedPharmacyActions, /const canCancelReview\s*=/);

  assert.match(
    ownedPharmacyActions,
    /pharmacy\.reviewState === 'changes_requested'/
  );

  assert.match(ownedPharmacyActions, /sendOwnedPharmacyForVerification\(/);
  assert.match(ownedPharmacyActions, /submitOwnedPharmacyModeration\(/);
  assert.match(ownedPharmacyActions, /cancelOwnedPharmacyReview\(/);
  assert.match(registry, /subscribeToPharmacyModerationRefresh/);
  assert.match(linked, /subscribeToPharmacyModerationRefresh/);
  assert.match(backend, /PHARMACY_CORRECTIONS_REQUESTED/);

  // Emergency Admin blocking is allowed even with unfinished orders.
  assert.match(
    backend,
    /Emergency Admin block must remain possible even with unfinished orders/
  );

  assert.doesNotMatch(backend, /assertPharmacyHasNoActiveOrders/);
  assert.match(backend, /assertPharmacyOwnerCanOperate/);
  assert.match(schema, /max\(1000\)/);
});

//===================================================================

test('14.14: dropdown closes on pharmacy/revision changes without setting state in an effect', async () => {
  const actionsSource = await read(
    './PharmacyDetailsPageContent/PharmacyModerationActions.tsx'
  );

  assert.match(
    actionsSource,
    /const menuOpen = options\.length > 0 && openMenuKey === menuKey/
  );

  assert.match(actionsSource, /detail\.id/);
  assert.match(actionsSource, /detail\.status/);
  assert.match(actionsSource, /detail\.reviewState/);
  assert.match(actionsSource, /detail\.owner\?\.status/);
  assert.match(actionsSource, /detail\.dates\.updatedAt/);

  assert.doesNotMatch(
    actionsSource,
    /useEffect\(\(\) => \{\s*setOpenMenuKey\(/
  );
});
