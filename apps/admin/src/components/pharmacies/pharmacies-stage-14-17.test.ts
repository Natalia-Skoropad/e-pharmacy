import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';
import type { ISODateTimeString } from '@e-pharmacy/types/primitives';
import { getPharmacyModerationOptions } from '../../lib/pharmacies/pharmacy-moderation-actions';

//===================================================================

const read = (path: string) => readFile(new URL(path, import.meta.url), 'utf8');
const REV = '2026-10-13T00:00:00.000Z' as ISODateTimeString;

//===================================================================

function detail(
  status: AdminPharmacyDetail['status'],
  ownerStatus: 'new' | 'active' | 'blocked',
  activated = false,
  reviewState: AdminPharmacyDetail['reviewState'] = 'pending'
): AdminPharmacyDetail {
  return {
    id: '507f1f77bcf86cd799439011',
    status,

    owner: {
      id: '507f1f77bcf86cd799439012',
      name: 'Owner',
      email: 'owner@example.test',
      phone: '+380501234567',
      status: ownerStatus,
    },

    reviewState,
    current: { name: 'Published pharmacy', bankTransferAvailable: false },

    dates: {
      createdAt: REV,
      updatedAt: REV,
      ...(activated ? { activatedAt: REV } : {}),
    },

    documentCount: 0,

    metrics: {
      activeClientsCount: 0,
      successfulOrdersCount: 0,
      successfulRevenue: 0,
      rating: 0,
      reviewsCount: 0,
    },
  };
}

//===================================================================

test('14.17: a new Owner can be approved for their first pharmacy; blocked Owners cannot', () => {
  const first = getPharmacyModerationOptions(detail('on_verification', 'new'));

  assert.equal(first[0]?.action, 'approve');
  assert.equal(first[0]?.targetStatus, 'active');
  assert.equal(first[0]?.label, 'Approve & activate');

  assert.ok(
    !getPharmacyModerationOptions(detail('on_verification', 'blocked')).some(
      (item) => item.action === 'approve'
    )
  );

  assert.deepEqual(getPharmacyModerationOptions(detail('new', 'new')), []);
});

//===================================================================

test('14.17: resubmission and blocked transitions retain canonical UI matrix', () => {
  for (const status of ['on_verification', 'on_moderation'] as const) {
    assert.deepEqual(
      getPharmacyModerationOptions(
        detail(status, 'new', false, 'changes_requested')
      ).map(({ action }) => action),
      ['request_corrections', 'block']
    );
  }

  assert.equal(
    getPharmacyModerationOptions(detail('blocked', 'new', false))[0]
      ?.targetStatus,
    'on_verification'
  );

  assert.equal(
    getPharmacyModerationOptions(detail('blocked', 'active', true))[0]
      ?.targetStatus,
    'active'
  );

  assert.deepEqual(
    getPharmacyModerationOptions(detail('blocked', 'blocked', true)),
    []
  );
});

//===================================================================

test('14.17: permissions protect both the moderation menu and direct admin API', async () => {
  const [detailUi, moderation, routes] = await Promise.all([
    read('./PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'),
    read('./PharmacyDetailsPageContent/PharmacyModerationActions.tsx'),
    read('../../../../api/src/routes/admin.routes.ts'),
  ]);

  assert.match(
    detailUi,
    /canAdmin\(access, ADMIN_PERMISSIONS\.pharmacies\.moderate\)/
  );

  assert.match(detailUi, /detail && canModerate/);
  assert.match(moderation, /<ReasonModal/);
  assert.match(moderation, /inFlight\.current/);
  assert.match(moderation, /clientRequestId: action\.clientRequestId/);
  assert.match(moderation, /conflict: true/);

  assert.match(
    routes,
    /'\/pharmacies\/:pharmacyId\/moderation-decisions',\s*requireAdminPermission\(ADMIN_PERMISSIONS\.pharmacies\.moderate\)/
  );
});

//===================================================================

test('14.17: only the active resource tab loads; future tabs remain informational', async () => {
  const [detailUi, docs, comments, activity, browser] = await Promise.all([
    read('./PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'),
    read('./PharmacyDetailsPageContent/PharmacyDocumentsTab.tsx'),
    read('./PharmacyDetailsPageContent/PharmacyCommentsTab.tsx'),
    read('./PharmacyDetailsPageContent/PharmacyActivityTab.tsx'),
    read('../../lib/api/browser/admin-pharmacy-detail.api.ts'),
  ]);

  assert.match(detailUi, /activeTab === 'documents' && detail/);
  assert.match(detailUi, /activeTab === 'comments' && detail/);
  assert.match(detailUi, /activeTab === 'activity' && detail/);
  assert.match(detailUi, /DEFERRED_TABS\[activeTab\]/);

  assert.doesNotMatch(
    detailUi + browser,
    /getAdminPharmacyReviews|getAdminPharmacyOrders|getAdminPharmacyClients|getAdminPharmacyProducts\(/
  );

  assert.match(
    docs,
    /getAdminPharmacyDocuments\(pharmacyId, \{ signal: controller\.signal \}\)/
  );

  assert.match(
    comments,
    /getAdminPharmacyComments\(pharmacyId, \{ signal: controller\.signal \}\)/
  );

  assert.match(activity, /scopePharmacyId=\{pharmacyId\}/);
});

//===================================================================

test('14.17: document UI is read-only, aborts requests and revokes private preview URLs', async () => {
  const docs = await read(
    './PharmacyDetailsPageContent/PharmacyDocumentsTab.tsx'
  );

  assert.match(docs, /editable=\{false\}/);
  assert.match(docs, /new AbortController\(\)/);
  assert.match(docs, /controller\.abort\(\)/);
  assert.match(docs, /URL\.revokeObjectURL\(/);
  assert.match(docs, /<ModalBase/);
  assert.match(docs, /title=\{`PDF preview of \$\{preview\.name\}`\}/);

  assert.doesNotMatch(
    docs,
    /uploadAdminPharmacyDocument|deleteAdminPharmacyDocument|replaceAdminPharmacyDocument/
  );
});

//===================================================================

test('14.17: admin comments are private, permission-gated, idempotent and abortable', async () => {
  const [comments, routes] = await Promise.all([
    read('./PharmacyDetailsPageContent/PharmacyCommentsTab.tsx'),
    read('../../../../api/src/routes/admin.routes.ts'),
  ]);

  assert.match(comments, /if \(\s*!canManage/);
  assert.match(comments, /requestRef\.current = request/);
  assert.match(comments, /clientRequestId: createRequestId\(\)/);
  assert.match(comments, /createControllerRef\.current\?\.abort\(\)/);
  assert.match(comments, /deleteControllerRef\.current\?\.abort\(\)/);

  assert.match(
    routes,
    /'\/pharmacies\/:pharmacyId\/comments',\s*requireAdminPermission\(ADMIN_PERMISSIONS\.pharmacies\.view\)/
  );

  assert.match(
    routes,
    /adminRoutes\.post\(\s*'\/pharmacies\/:pharmacyId\/comments',\s*requireAdminPermission\(ADMIN_PERMISSIONS\.pharmacies\.edit\)/
  );
});

//===================================================================

test('14.17: error, conflict, A11y and mobile styles are available without proxy UI', async () => {
  const [detailUi, moderation, activity, docsCss, tabsCss, actionCss] =
    await Promise.all([
      read('./PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx'),
      read('./PharmacyDetailsPageContent/PharmacyModerationActions.tsx'),
      read('../activity/ActivityHistory.tsx'),
      read('./PharmacyDetailsPageContent/PharmacyResourceTabs.module.css'),

      read(
        './PharmacyDetailsPageContent/PharmacyDetailsPageContent.module.css'
      ),

      read('./PharmacyDetailsPageContent/PharmacyModerationActions.module.css'),
    ]);

  assert.match(detailUi, /<NotFoundPage/);
  assert.match(detailUi, /variant="error"/);
  assert.match(detailUi, /role="tabpanel"/);
  assert.match(detailUi, /aria-labelledby=/);
  assert.match(detailUi, /mobileVisibleCount=\{1\}/);
  assert.match(activity, /minWidth=\{950\}/);
  assert.match(moderation, /event\.key === 'Escape'/);
  assert.match(moderation, /aria-expanded=\{menuOpen\}/);
  assert.match(docsCss + tabsCss + actionCss, /max-width: (?:640|767)px/);

  assert.doesNotMatch(
    docsCss + tabsCss + actionCss,
    /(?:linear|radial|conic)-gradient\s*\(/
  );
});
