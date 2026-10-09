import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getAdminAuditLocation,
  getAdminAuditPageLocation,
} from './admin-audit-presentation';

//===================================================================

const baseAudit = {
  section: 'pharmacies' as const,
  entityType: 'pharmacy' as const,
  entityId: '507f191e810c19729de860e1',
  entityLabelSnapshot: 'CarePoint Pharmacy Uzhhorod 40',
  actorUserId: '507f191e810c19729de860e3',
  scopeEntityType: 'pharmacyOwner' as const,
  scopeEntityId: '507f191e810c19729de860e2',
};

//===================================================================

test('pharmacy section links to the list and details link to the pharmacy rather than owner', () => {
  assert.deepEqual(getAdminAuditLocation(baseAudit), {
    section: 'pharmacies',
    label: 'Pharmacies',
    href: '/admin/pharmacies',
  });

  assert.deepEqual(getAdminAuditPageLocation(baseAudit), {
    section: 'pharmacies',
    entityId: baseAudit.entityId,
    label: baseAudit.entityLabelSnapshot,
    href: `/admin/pharmacies/${baseAudit.entityId}`,
  });
});

//===================================================================

test('owner documents open their owner page instead of the document ID', () => {
  const location = getAdminAuditPageLocation({
    ...baseAudit,
    section: 'pharmacyOwners',
    entityType: 'pharmacyOwnerDocument',
  });

  assert.equal(
    location?.href,
    `/admin/pharmacy-owners/${baseAudit.scopeEntityId}`
  );
});

//===================================================================

test('legacy personal profile audit appears under Employees', () => {
  const audit = {
    ...baseAudit,
    section: 'profile' as const,
    entityType: 'adminEmployeeDocument' as const,
    scopeEntityType: undefined,
    scopeEntityId: undefined,
  };

  assert.equal(getAdminAuditLocation(audit).href, '/admin/settings/employees');

  assert.equal(
    getAdminAuditPageLocation(audit)?.href,
    `/admin/settings/employees/${baseAudit.actorUserId}`
  );
});

//===================================================================

test('positions and product categories do not invent entity detail URLs', () => {
  for (const [section, entityType] of [
    ['positions', 'position'],
    ['categories', 'productCategory'],
  ] as const) {
    assert.equal(
      getAdminAuditPageLocation({ ...baseAudit, section, entityType }),
      null
    );
  }
});
