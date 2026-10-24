export const ADMIN_PERMISSION_MATRIX = {
  pharmacyOwners: ['view', 'edit'],
  pharmacies: ['view', 'edit', 'moderate'],
  products: ['view', 'create', 'edit', 'delete'],
  productRequests: ['view', 'edit', 'moderate'],
  clients: ['view'],
  orders: ['view'],
  productReviews: ['view', 'moderate'],
  pharmacyReviews: ['view', 'moderate'],
  sitePages: ['view', 'edit', 'publish'],
  categories: ['view', 'create', 'edit', 'delete'],
  employees: ['view', 'create', 'edit', 'managePermissions', 'revokeAccess'],
  positions: ['view', 'create', 'edit', 'delete'],
  audit: ['view'],
} as const;

//===============================================================

type AdminPermissionMatrix = typeof ADMIN_PERMISSION_MATRIX;

export type AdminPermissionResource = keyof AdminPermissionMatrix;

export type AdminPermission = {
  [Resource in AdminPermissionResource]: `${Resource}.${AdminPermissionMatrix[Resource][number]}`;
}[AdminPermissionResource];

//===============================================================

function permission<Resource extends AdminPermissionResource>(
  resource: Resource,
  action: AdminPermissionMatrix[Resource][number]
): AdminPermission {
  return `${resource}.${action}` as AdminPermission;
}

//===============================================================

export const ADMIN_PERMISSIONS = {
  pharmacyOwners: {
    view: permission('pharmacyOwners', 'view'),
    edit: permission('pharmacyOwners', 'edit'),
  },

  pharmacies: {
    view: permission('pharmacies', 'view'),
    edit: permission('pharmacies', 'edit'),
    moderate: permission('pharmacies', 'moderate'),
  },

  products: {
    view: permission('products', 'view'),
    create: permission('products', 'create'),
    edit: permission('products', 'edit'),
    delete: permission('products', 'delete'),
  },

  productRequests: {
    view: permission('productRequests', 'view'),
    edit: permission('productRequests', 'edit'),
    moderate: permission('productRequests', 'moderate'),
  },

  clients: {
    view: permission('clients', 'view'),
  },

  orders: {
    view: permission('orders', 'view'),
  },

  productReviews: {
    view: permission('productReviews', 'view'),
    moderate: permission('productReviews', 'moderate'),
  },

  pharmacyReviews: {
    view: permission('pharmacyReviews', 'view'),
    moderate: permission('pharmacyReviews', 'moderate'),
  },

  sitePages: {
    view: permission('sitePages', 'view'),
    edit: permission('sitePages', 'edit'),
    publish: permission('sitePages', 'publish'),
  },

  categories: {
    view: permission('categories', 'view'),
    create: permission('categories', 'create'),
    edit: permission('categories', 'edit'),
    delete: permission('categories', 'delete'),
  },

  employees: {
    view: permission('employees', 'view'),
    create: permission('employees', 'create'),
    edit: permission('employees', 'edit'),
    managePermissions: permission('employees', 'managePermissions'),
    revokeAccess: permission('employees', 'revokeAccess'),
  },

  positions: {
    view: permission('positions', 'view'),
    create: permission('positions', 'create'),
    edit: permission('positions', 'edit'),
    delete: permission('positions', 'delete'),
  },

  audit: {
    view: permission('audit', 'view'),
  },
} as const;

//===============================================================

export const ADMIN_PERMISSION_VALUES = Object.freeze(
  Object.values(ADMIN_PERMISSIONS).flatMap((actions) =>
    Object.values(actions)
  ) as AdminPermission[]
);

const ADMIN_PERMISSION_SET = new Set<string>(ADMIN_PERMISSION_VALUES);

//===============================================================

export function isAdminPermission(value: unknown): value is AdminPermission {
  return typeof value === 'string' && ADMIN_PERMISSION_SET.has(value);
}

//===============================================================

export function normalizeAdminPermissions(
  values: readonly unknown[]
): AdminPermission[] {
  const normalized = new Set<AdminPermission>();

  for (const value of values) {
    if (!isAdminPermission(value)) {
      throw new TypeError('Admin access contains an unknown permission.');
    }

    normalized.add(value);
  }

  return [...normalized].sort();
}
