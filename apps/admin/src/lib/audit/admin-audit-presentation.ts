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
};

//===================================================================

const ENTITY_LABELS: Record<AdminAuditEntityType, string> = {
  pharmacy: 'Pharmacy',
  productRequest: 'Product request',
  adminAccess: 'Admin access',
  adminEmployee: 'Admin employee',
  adminEmployeeDocument: 'Admin document',
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
