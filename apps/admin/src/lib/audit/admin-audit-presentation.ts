import {
  PHARMACY_STATUS_PRESENTATION,
  PRODUCT_REQUEST_STATUS_PRESENTATION,
  type StatusPresentationTone,
} from '@e-pharmacy/config/presentation';

import { ADMIN_ROUTES } from '@/lib/routes';

import type {
  AdminAuditAction,
  AdminAuditEntityType,
  AdminAuditListItem,
  AdminAuditSection,
  AdminAuditValue,
} from './admin-audit';

//===================================================================

const ACTION_LABELS: Record<AdminAuditAction, string> = {
  'pharmacy.status.changed': 'Pharmacy status changed',
  'productRequest.status.changed': 'Product request status changed',
  'admin.platformOwner.granted': 'Platform Owner granted',
  'admin.platformOwner.revoked': 'Platform Owner removed',
  'adminEmployee.profile.updated': 'Admin profile updated',
  'adminEmployee.document.uploaded': 'Admin document uploaded',
  'adminEmployee.document.replaced': 'Admin document replaced',
  'adminEmployee.document.deleted': 'Admin document deleted',
  'productCategory.created': 'Product category created',
  'productCategory.updated': 'Product category updated',
  'productCategory.deleted': 'Product category deleted',
  'position.created': 'Position created',
  'position.updated': 'Position updated',
  'position.deleted': 'Position deleted',
};

//===================================================================

const STATUS_PRESENTATION_BY_VALUE = {
  active: PHARMACY_STATUS_PRESENTATION.active,
  blocked: PHARMACY_STATUS_PRESENTATION.blocked,
  new: PHARMACY_STATUS_PRESENTATION.new,
  on_verification: PHARMACY_STATUS_PRESENTATION.on_verification,
  on_moderation: PHARMACY_STATUS_PRESENTATION.on_moderation,
  draft: PRODUCT_REQUEST_STATUS_PRESENTATION.draft,
  in_progress: PRODUCT_REQUEST_STATUS_PRESENTATION.in_progress,
  approved: PRODUCT_REQUEST_STATUS_PRESENTATION.approved,
  rejected: PRODUCT_REQUEST_STATUS_PRESENTATION.rejected,
} as const;

//===================================================================

type KnownAuditStatus = keyof typeof STATUS_PRESENTATION_BY_VALUE;

//===================================================================

const CREATE_ACTIONS: ReadonlySet<AdminAuditAction> = new Set([
  'admin.platformOwner.granted',
  'adminEmployee.document.uploaded',
  'productCategory.created',
  'position.created',
]);

const DELETE_ACTIONS: ReadonlySet<AdminAuditAction> = new Set([
  'admin.platformOwner.revoked',
  'adminEmployee.document.deleted',
  'productCategory.deleted',
  'position.deleted',
]);

const UPDATE_ACTIONS: ReadonlySet<AdminAuditAction> = new Set([
  'adminEmployee.profile.updated',
  'adminEmployee.document.replaced',
  'productCategory.updated',
  'position.updated',
]);

//===================================================================

const ENTITY_LABELS: Record<AdminAuditEntityType, string> = {
  pharmacy: 'Pharmacy',
  productRequest: 'Product request',
  adminAccess: 'Admin access',
  adminEmployee: 'Admin employee',
  adminEmployeeDocument: 'Admin document',
  productCategory: 'Product category',
  position: 'Position',
};

//===================================================================

const SECTION_LABELS: Record<AdminAuditSection, string> = {
  profile: 'Profile',
  pharmacyOwners: 'Pharmacy owners',
  pharmacies: 'Pharmacies',
  products: 'Products',
  productRequests: 'Product requests',
  clients: 'Clients',
  orders: 'Orders',
  productReviews: 'Product reviews',
  pharmacyReviews: 'Pharmacy reviews',
  employees: 'Employees',
  positions: 'Positions',
  sitePages: 'Site pages',
  categories: 'Product categories',
};

//===================================================================

const SECTION_ROUTES: Record<AdminAuditSection, string> = {
  profile: ADMIN_ROUTES.PROFILE,
  pharmacyOwners: ADMIN_ROUTES.PHARMACY_OWNERS,
  pharmacies: ADMIN_ROUTES.PHARMACIES,
  products: ADMIN_ROUTES.PRODUCTS,
  productRequests: ADMIN_ROUTES.PRODUCT_REQUESTS,
  clients: ADMIN_ROUTES.CLIENTS,
  orders: ADMIN_ROUTES.ORDERS,
  productReviews: ADMIN_ROUTES.REVIEWS_PRODUCTS,
  pharmacyReviews: ADMIN_ROUTES.REVIEWS_PHARMACIES,
  employees: ADMIN_ROUTES.SETTINGS_EMPLOYEES,
  positions: ADMIN_ROUTES.SETTINGS_POSITIONS,
  sitePages: ADMIN_ROUTES.SETTINGS_SITE_PAGES,
  categories: ADMIN_ROUTES.SETTINGS_PRODUCT_CATEGORIES,
};

//===================================================================

export type AdminAuditLocation = Readonly<{
  section: AdminAuditSection;
  label: string;
  href: string;
}>;

//===================================================================

export function getAdminAuditActionLabel(action: AdminAuditAction): string {
  return ACTION_LABELS[action];
}

//===================================================================

export function getAdminAuditEntityLabel(
  entityType: AdminAuditEntityType
): string {
  return ENTITY_LABELS[entityType];
}

//===================================================================

export function getAdminAuditSectionLabel(section: AdminAuditSection): string {
  return SECTION_LABELS[section];
}

//===================================================================

export function getAdminAuditLocation(
  item: Pick<
    AdminAuditListItem,
    | 'actorUserId'
    | 'entityId'
    | 'entityLabelSnapshot'
    | 'entityType'
    | 'section'
  >
): AdminAuditLocation {
  const sectionLabel = SECTION_LABELS[item.section];

  if (item.section === 'pharmacies' && item.entityType === 'pharmacy') {
    return {
      section: item.section,
      label: `${sectionLabel} · ${item.entityLabelSnapshot}`,
      href: `${ADMIN_ROUTES.PHARMACIES}/${encodeURIComponent(item.entityId)}`,
    };
  }

  if (
    item.section === 'productRequests' &&
    item.entityType === 'productRequest'
  ) {
    return {
      section: item.section,
      label: `${sectionLabel} · ${item.entityLabelSnapshot}`,
      href: `${ADMIN_ROUTES.PRODUCT_REQUESTS}/${encodeURIComponent(item.entityId)}`,
    };
  }

  if (item.section === 'employees') {
    const employeeId =
      item.entityType === 'adminEmployee' || item.entityType === 'adminAccess'
        ? item.entityId
        : item.actorUserId;

    return {
      section: item.section,
      label: `${sectionLabel} · ${item.entityLabelSnapshot}`,
      href: `${ADMIN_ROUTES.SETTINGS_EMPLOYEES}/${encodeURIComponent(employeeId)}`,
    };
  }

  return {
    section: item.section,
    label: sectionLabel,
    href: SECTION_ROUTES[item.section],
  };
}

//===================================================================

export function formatAdminAuditValue(
  value: AdminAuditValue | undefined
): string {
  if (value === undefined) return '—';
  if (value === null) return 'None';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'None';
  return String(value);
}

//===================================================================

function isKnownAuditStatus(value: string): value is KnownAuditStatus {
  return Object.prototype.hasOwnProperty.call(
    STATUS_PRESENTATION_BY_VALUE,
    value
  );
}

//===================================================================

export function getAdminAuditChangeTone(
  item: Pick<AdminAuditListItem, 'action' | 'statusAfter'>
): StatusPresentationTone {
  if (item.statusAfter && isKnownAuditStatus(item.statusAfter)) {
    return STATUS_PRESENTATION_BY_VALUE[item.statusAfter].tone;
  }

  if (CREATE_ACTIONS.has(item.action)) return 'success';
  if (DELETE_ACTIONS.has(item.action)) return 'danger';
  if (UPDATE_ACTIONS.has(item.action)) return 'pending';

  return 'info';
}

//===================================================================

export function getAdminAuditStatusTransitionLabel(
  item: Pick<AdminAuditListItem, 'statusBefore' | 'statusAfter'>
): string | null {
  if (!item.statusBefore || !item.statusAfter) return null;

  const before = isKnownAuditStatus(item.statusBefore)
    ? STATUS_PRESENTATION_BY_VALUE[item.statusBefore].label
    : item.statusBefore;

  const after = isKnownAuditStatus(item.statusAfter)
    ? STATUS_PRESENTATION_BY_VALUE[item.statusAfter].label
    : item.statusAfter;

  return `${before} → ${after}`;
}
