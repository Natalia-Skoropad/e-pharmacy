import { isValidObjectId } from '@e-pharmacy/validation/url';

import { isClientsFilterRoute } from '@/lib/clients/client-paths';
import { isOrdersFilterRoute } from '@/lib/orders/order-paths';
import { isProductRequestsFilterRoute } from '@/lib/product-requests/product-request-paths';
import { isAllProductsFilterRoute } from '@/lib/products/all-product-paths';
import { isOwnProductsFilterRoute } from '@/lib/products/own-product-paths';

import {
  PHARMACY_ROUTES,
  getPharmacyAllProductPath,
  getPharmacyProductPath,
  getPharmacyRequestPath,
  matchPharmacyRoute,
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

function getSingleEntityId(segments: readonly string[]): string | null {
  if (segments.length !== 1) return null;

  const [id] = segments;
  return id && isValidObjectId(id) ? id : null;
}

//===================================================================

export function getPharmacyBreadcrumbsByPathname(
  pathname: string,
  currentDetailLabel?: string
): BreadcrumbItem[] {
  const route = matchPharmacyRoute(pathname);

  if (route.family === 'dashboard' || route.family === 'unknown') {
    return getDashboardBreadcrumbs();
  }

  if (route.family === 'profile') {
    return getProfileBreadcrumbs();
  }

  if (route.family === 'orders') {
    if (
      pathname.split('?')[0]?.replace(/\/$/, '') === PHARMACY_ROUTES.ORDER_NEW
    ) {
      return getPharmacyBreadcrumbs(
        { label: 'New order' },
        { label: 'Orders', href: PHARMACY_ROUTES.ORDERS }
      );
    }

    if (isOrdersFilterRoute([...route.segments])) {
      return getOrdersBreadcrumbs();
    }

    const orderId = getSingleEntityId(route.segments);
    return orderId
      ? getOrderDetailsBreadcrumbs(orderId, currentDetailLabel)
      : getOrdersBreadcrumbs();
  }

  if (route.family === 'clients') {
    if (isClientsFilterRoute([...route.segments])) {
      return getClientsBreadcrumbs();
    }

    const clientId = getSingleEntityId(route.segments);
    return clientId
      ? getClientDetailsBreadcrumbs(clientId, currentDetailLabel)
      : getClientsBreadcrumbs();
  }

  if (route.family === 'products') {
    if (isOwnProductsFilterRoute([...route.segments])) {
      return getProductsBreadcrumbs();
    }

    const productId = getSingleEntityId(route.segments);
    return productId
      ? getProductDetailsBreadcrumbs(productId, currentDetailLabel)
      : getProductsBreadcrumbs();
  }

  if (route.family === 'all-products') {
    if (isAllProductsFilterRoute([...route.segments])) {
      return getAllProductsBreadcrumbs();
    }

    const productId = getSingleEntityId(route.segments);
    return productId
      ? getAllProductDetailsBreadcrumbs(productId, currentDetailLabel)
      : getAllProductsBreadcrumbs();
  }

  if (route.family === 'product-requests') {
    if (
      pathname.split('?')[0]?.replace(/\/$/, '') ===
      PHARMACY_ROUTES.PRODUCT_REQUEST_NEW
    ) {
      return getNewProductRequestBreadcrumbs();
    }

    if (isProductRequestsFilterRoute([...route.segments])) {
      return getProductRequestsBreadcrumbs();
    }

    const requestId = getSingleEntityId(route.segments);
    return requestId
      ? getProductRequestDetailsBreadcrumbs(requestId, currentDetailLabel)
      : getProductRequestsBreadcrumbs();
  }

  return getDashboardBreadcrumbs();
}
