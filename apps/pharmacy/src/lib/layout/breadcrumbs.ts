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

const BREADCRUMB_LABEL_EVENT = 'pharmacy:breadcrumb-current-label';

//===================================================================

export function dispatchPharmacyBreadcrumbLabel(label: string): void {
  if (typeof window === 'undefined') return;

  const dispatch = () => {
    window.dispatchEvent(
      new CustomEvent(BREADCRUMB_LABEL_EVENT, {
        detail: {
          pathname: window.location.pathname,
          label,
        },
      })
    );
  };

  if (typeof window.queueMicrotask === 'function') {
    window.queueMicrotask(dispatch);
    return;
  }

  void Promise.resolve().then(dispatch);
}

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

export const PHARMACY_BREADCRUMB_ROOTS = {
  dashboard: PHARMACY_ROUTES.DASHBOARD,
  profile: PHARMACY_ROUTES.PROFILE,
  orders: PHARMACY_ROUTES.ORDERS,
  clients: PHARMACY_ROUTES.CLIENTS,
  products: PHARMACY_ROUTES.PRODUCTS,
  allProducts: PHARMACY_ROUTES.ALL_PRODUCTS,
  productRequests: PHARMACY_ROUTES.PRODUCT_REQUESTS,
} as const;

//===================================================================

function isFilterSegment(segment: string | undefined): boolean {
  if (!segment) return false;

  return [
    'status-',
    'delivery-',
    'payment-',
    'date-',
    'date-from-',
    'date-to-',
    'added-to-my-pharmacy-',
    'request-number-',
    'product-article-',
    'product-name-',
    'order-number-',
    'client-',
    'search-',
    'client-id-',
    'email-',
    'phone-',
    'address-',
    'category-',
    'stock-',
    'article-',
    'name-',
  ].some((prefix) => segment.startsWith(prefix));
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

    return id && !isFilterSegment(id)
      ? getOrderDetailsBreadcrumbs(id, currentDetailLabel)
      : getOrdersBreadcrumbs();
  }

  if (section === 'clients') {
    return id && !isFilterSegment(id)
      ? getClientDetailsBreadcrumbs(id, currentDetailLabel)
      : getClientsBreadcrumbs();
  }

  if (section === 'products') {
    return id && !isFilterSegment(id)
      ? getProductDetailsBreadcrumbs(id, currentDetailLabel)
      : getProductsBreadcrumbs();
  }

  if (section === 'all-products') {
    return id && !isFilterSegment(id)
      ? getAllProductDetailsBreadcrumbs(id, currentDetailLabel)
      : getAllProductsBreadcrumbs();
  }

  if (section === 'product-requests') {
    if (id === 'new') {
      return getNewProductRequestBreadcrumbs();
    }

    if (id && action === 'edit') {
      return getEditProductRequestBreadcrumbs(id);
    }

    return id && !isFilterSegment(id)
      ? getProductRequestDetailsBreadcrumbs(id, currentDetailLabel)
      : getProductRequestsBreadcrumbs();
  }

  return getDashboardBreadcrumbs();
}
