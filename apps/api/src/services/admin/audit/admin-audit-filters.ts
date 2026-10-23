import { Types } from 'mongoose';

import {
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
  type AdminAuditEntityType,
  type AdminAuditSection,
} from '../../../constants/admin-audit';

//===============================================================

export function startOfUtcDay(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

//===============================================================

export function endOfUtcDay(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}

//===============================================================

const LEGACY_AUDIT_SECTION_ENTITY_TYPES: Readonly<
  Record<AdminAuditSection, readonly AdminAuditEntityType[]>
> = {
  [ADMIN_AUDIT_SECTIONS.PROFILE]: [
    ADMIN_AUDIT_ENTITY_TYPES.ADMIN_EMPLOYEE,
    ADMIN_AUDIT_ENTITY_TYPES.ADMIN_EMPLOYEE_DOCUMENT,
  ],

  [ADMIN_AUDIT_SECTIONS.PHARMACY_OWNERS]: [],
  [ADMIN_AUDIT_SECTIONS.PHARMACIES]: [ADMIN_AUDIT_ENTITY_TYPES.PHARMACY],
  [ADMIN_AUDIT_SECTIONS.PRODUCTS]: [],

  [ADMIN_AUDIT_SECTIONS.PRODUCT_REQUESTS]: [
    ADMIN_AUDIT_ENTITY_TYPES.PRODUCT_REQUEST,
  ],

  [ADMIN_AUDIT_SECTIONS.CLIENTS]: [],
  [ADMIN_AUDIT_SECTIONS.ORDERS]: [],
  [ADMIN_AUDIT_SECTIONS.PRODUCT_REVIEWS]: [],
  [ADMIN_AUDIT_SECTIONS.PHARMACY_REVIEWS]: [],

  [ADMIN_AUDIT_SECTIONS.EMPLOYEES]: [
    ADMIN_AUDIT_ENTITY_TYPES.ADMIN_ACCESS,
    ADMIN_AUDIT_ENTITY_TYPES.ADMIN_EMPLOYEE,
    ADMIN_AUDIT_ENTITY_TYPES.ADMIN_EMPLOYEE_DOCUMENT,
  ],

  [ADMIN_AUDIT_SECTIONS.POSITIONS]: [],
  [ADMIN_AUDIT_SECTIONS.SITE_PAGES]: [],
  [ADMIN_AUDIT_SECTIONS.CATEGORIES]: [],
};

//===============================================================

export function applyAuditSectionFilter(
  filter: Record<string, unknown>,
  section: AdminAuditSection
): void {
  filter.$or = [
    ...(section === ADMIN_AUDIT_SECTIONS.EMPLOYEES
      ? [{ section }, { section: ADMIN_AUDIT_SECTIONS.PROFILE }]
      : [{ section }]),
    {
      section: { $exists: false },
      entityType: { $in: LEGACY_AUDIT_SECTION_ENTITY_TYPES[section] },
    },
  ];
}

//===============================================================

/** Exact server-side pharmacy scoping, including legacy rows that predate
 * pharmacyId. Neither an owner's ID nor an untyped entityId can match here. */
export function buildPharmacyAuditScopeFilter(
  pharmacyId: string
): Record<string, unknown> {
  if (!Types.ObjectId.isValid(pharmacyId)) {
    throw new TypeError('Pharmacy audit scope id is invalid.');
  }

  const id = pharmacyId.toLowerCase();

  return {
    $or: [
      { pharmacyId: id },
      { entityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY, entityId: id },
      {
        scopeEntityType: ADMIN_AUDIT_ENTITY_TYPES.PHARMACY,
        scopeEntityId: id,
        section: ADMIN_AUDIT_SECTIONS.PHARMACIES,
      },
    ],
  };
}
