import { isValidObjectId } from '@e-pharmacy/validation/url';

import { isClientsFilterSegment } from '@/lib/clients/client-paths';
import { isOrdersFilterSegment } from '@/lib/orders/order-paths';
import { isProductRequestsFilterSegment } from '@/lib/product-requests/product-request-paths';
import { isAllProductsFilterSegment } from '@/lib/products/all-product-paths';
import { isOwnProductsFilterSegment } from '@/lib/products/own-product-paths';

import {
  PHARMACY_ROUTES,
  getPharmacyAllProductPath,
  getPharmacyProductPath,
  getPharmacyRequestPath,
} from '@/lib/routes';

//===================================================================

export type BreadcrumbItem = Readonly<{
  label: string;
  href?: string;
}>;

//===================================================================

export { dispatchPharmacyBreadcrumbLabel } from './breadcrumb-label-event';

//===================================================================

export function getPharmacyBreadcrumbs(
  current: BreadcrumbItem,
  parent?: BreadcrumbItem
): BreadcrumbItem[] {
  return parent ? [parent, current] : [current];
}

//===================================================================

export function getDashboardBreadcrumbs(): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs({ label: 'Dashboard' });
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

export function getOrderDetailsBreadcrumbs(
  orderId: string,
  orderLabel?: string
): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs(
    { label: orderLabel ?? `Order #${orderId}` },
    { label: 'Orders', href: PHARMACY_ROUTES.ORDERS }
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
  clientId: string,
  clientLabel?: string
): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs(
    { label: clientLabel ?? `Client #${clientId}` },
    { label: 'Clients', href: PHARMACY_ROUTES.CLIENTS }
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
  productId: string,
  productName?: string
): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs(
    {
      label: productName ?? `Product ${productId}`,
      href: getPharmacyProductPath(productId),
    },
    { label: 'Own products', href: PHARMACY_ROUTES.PRODUCTS }
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
  productId: string,
  productName?: string
): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs(
    {
      label: productName ?? `Global product ${productId}`,
      href: getPharmacyAllProductPath(productId),
    },
    { label: 'All products', href: PHARMACY_ROUTES.ALL_PRODUCTS }
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
    { label: 'Product requests', href: PHARMACY_ROUTES.PRODUCT_REQUESTS }
  );
}

//===================================================================

export function getProductRequestDetailsBreadcrumbs(
  requestId: string,
  currentLabel = `Product request ${requestId}`
): BreadcrumbItem[] {
  return getPharmacyBreadcrumbs(
    {
      label: currentLabel,
      href: getPharmacyRequestPath(requestId),
    },
    { label: 'Product requests', href: PHARMACY_ROUTES.PRODUCT_REQUESTS }
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

export function getPharmacyBreadcrumbsByPathname(
  pathname: string,
  currentDetailLabel?: string
): BreadcrumbItem[] {
  const cleanPathname = pathname.split('?')[0] ?? pathname;
  const segments = cleanPathname.split('/').filter(Boolean);
  const [, section, id, action] = segments;

  if (section === 'dashboard' || !section) {
    return getDashboardBreadcrumbs();
  }

  if (section === 'profile') {
    return getProfileBreadcrumbs();
  }

  if (section === 'orders') {
    if (id === 'new') {
      return getPharmacyBreadcrumbs(
        { label: 'New order' },
        { label: 'Orders', href: PHARMACY_ROUTES.ORDERS }
      );
    }

    return id && isValidObjectId(id) && !isOrdersFilterSegment(id)
      ? getOrderDetailsBreadcrumbs(id, currentDetailLabel)
      : getOrdersBreadcrumbs();
  }

  if (section === 'clients') {
    return id && isValidObjectId(id) && !isClientsFilterSegment(id)
      ? getClientDetailsBreadcrumbs(id, currentDetailLabel)
      : getClientsBreadcrumbs();
  }

  if (section === 'products') {
    return id && isValidObjectId(id) && !isOwnProductsFilterSegment(id)
      ? getProductDetailsBreadcrumbs(id, currentDetailLabel)
      : getProductsBreadcrumbs();
  }

  if (section === 'all-products') {
    return id && isValidObjectId(id) && !isAllProductsFilterSegment(id)
      ? getAllProductDetailsBreadcrumbs(id, currentDetailLabel)
      : getAllProductsBreadcrumbs();
  }

  if (section === 'product-requests') {
    if (id === 'new') {
      return getNewProductRequestBreadcrumbs();
    }

    if (id && isValidObjectId(id) && action === 'edit') {
      return getEditProductRequestBreadcrumbs(id);
    }

    return id && isValidObjectId(id) && !isProductRequestsFilterSegment(id)
      ? getProductRequestDetailsBreadcrumbs(id, currentDetailLabel)
      : getProductRequestsBreadcrumbs();
  }

  return getDashboardBreadcrumbs();
}
