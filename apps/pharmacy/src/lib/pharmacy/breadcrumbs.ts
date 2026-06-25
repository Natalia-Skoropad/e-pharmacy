import type { BreadcrumbItem } from '@e-pharmacy/ui/layout';

import {
  PHARMACY_ALL_PRODUCTS,
  PHARMACY_CLIENTS,
  PHARMACY_DASHBOARD,
  PHARMACY_ORDERS,
  PHARMACY_PRODUCTS,
  PHARMACY_PRODUCT_REQUESTS,
  PHARMACY_PROFILE,
  getPharmacyAllProductPath,
  getPharmacyProductPath,
  getPharmacyRequestPath,
} from './routes';

//===================================================================

const DASHBOARD_CRUMB: BreadcrumbItem = {
  label: 'Dashboard',
  href: PHARMACY_DASHBOARD,
};

//===================================================================

export function getPharmacyBreadcrumbs(
  current: BreadcrumbItem,
  parent?: BreadcrumbItem
): BreadcrumbItem[] {
  return parent
    ? [DASHBOARD_CRUMB, parent, current]
    : [DASHBOARD_CRUMB, current];
}

//===================================================================

export function getDashboardBreadcrumbs(): BreadcrumbItem[] {
  return [{ label: 'Dashboard' }];
}

//===================================================================

export function getProfileBreadcrumbs(): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs({ label: 'Pharmacy profile' });
}

//===================================================================

export function getOrdersBreadcrumbs(
  currentLabel = 'Orders'
): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs({ label: currentLabel });
}

//===================================================================

export function getOrderDetailsBreadcrumbs(orderId: string): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs(
    { label: `Order #${orderId}` },
    { label: 'Orders', href: PHARMACY_ORDERS }
  );
}

//===================================================================

export function getClientsBreadcrumbs(
  currentLabel = 'Clients'
): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs({ label: currentLabel });
}

//===================================================================

export function getClientDetailsBreadcrumbs(
  clientId: string
): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs(
    { label: `Client ${clientId}` },
    { label: 'Clients', href: PHARMACY_CLIENTS }
  );
}

//===================================================================

export function getProductsBreadcrumbs(
  currentLabel = 'Own products'
): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs({ label: currentLabel });
}

//===================================================================

export function getProductDetailsBreadcrumbs(
  productId: string
): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs(
    { label: `Product ${productId}`, href: getPharmacyProductPath(productId) },
    { label: 'Own products', href: PHARMACY_PRODUCTS }
  );
}

//===================================================================

export function getAllProductsBreadcrumbs(
  currentLabel = 'All products'
): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs({ label: currentLabel });
}

//===================================================================

export function getAllProductDetailsBreadcrumbs(
  productId: string
): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs(
    {
      label: `Global product ${productId}`,
      href: getPharmacyAllProductPath(productId),
    },
    { label: 'All products', href: PHARMACY_ALL_PRODUCTS }
  );
}

//===================================================================

export function getProductRequestsBreadcrumbs(
  currentLabel = 'Product requests'
): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs({ label: currentLabel });
}

//===================================================================

export function getNewProductRequestBreadcrumbs(): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs(
    { label: 'New product request' },
    { label: 'Product requests', href: PHARMACY_PRODUCT_REQUESTS }
  );
}

//===================================================================

export function getProductRequestDetailsBreadcrumbs(
  requestId: string
): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs(
    {
      label: `Product request ${requestId}`,
      href: getPharmacyRequestPath(requestId),
    },
    { label: 'Product requests', href: PHARMACY_PRODUCT_REQUESTS }
  );
}

//===================================================================

export function getEditProductRequestBreadcrumbs(
  requestId: string
): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs(
    { label: `Edit product request ${requestId}` },
    {
      label: `Product request ${requestId}`,
      href: getPharmacyRequestPath(requestId),
    }
  );
}

//===================================================================

export const PHARMACY_BREADCRUMB_ROOTS = {
  dashboard: PHARMACY_DASHBOARD,
  profile: PHARMACY_PROFILE,
  orders: PHARMACY_ORDERS,
  clients: PHARMACY_CLIENTS,
  products: PHARMACY_PRODUCTS,
  allProducts: PHARMACY_ALL_PRODUCTS,
  productRequests: PHARMACY_PRODUCT_REQUESTS,
} as const;
