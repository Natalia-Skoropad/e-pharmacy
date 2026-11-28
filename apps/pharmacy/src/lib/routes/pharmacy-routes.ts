import { isValidObjectId } from '@e-pharmacy/validation/url';
import type { EntityId } from '@e-pharmacy/types/primitives';

//===================================================================

const PHARMACY_ROOT = '/pharmacy';

//===================================================================

export const PHARMACY_ROUTES = {
  ROOT: PHARMACY_ROOT,
  DASHBOARD: `${PHARMACY_ROOT}/dashboard`,
  ORDERS: `${PHARMACY_ROOT}/orders`,
  ORDER_NEW: `${PHARMACY_ROOT}/orders/new`,
  CLIENTS: `${PHARMACY_ROOT}/clients`,
  PRODUCTS: `${PHARMACY_ROOT}/products`,
  ALL_PRODUCTS: `${PHARMACY_ROOT}/all-products`,
  PRODUCT_REQUESTS: `${PHARMACY_ROOT}/product-requests`,
  PRODUCT_REQUEST_NEW: `${PHARMACY_ROOT}/product-requests/new`,
  PHARMACIES: `${PHARMACY_ROOT}/pharmacies`,
  PROFILE: `${PHARMACY_ROOT}/profile`,
} as const;

//===================================================================

export type PharmacyRouteFamily =
  | 'dashboard'
  | 'profile'
  | 'orders'
  | 'clients'
  | 'products'
  | 'all-products'
  | 'product-requests'
  | 'pharmacies'
  | 'unknown';

//===================================================================

export type PharmacyRouteMatch = Readonly<{
  family: PharmacyRouteFamily;
  basePath: string | null;
  segments: readonly string[];
}>;

//===================================================================

const PHARMACY_ROUTE_FAMILIES = [
  { family: 'pharmacies', basePath: PHARMACY_ROUTES.PHARMACIES },
  { family: 'orders', basePath: PHARMACY_ROUTES.ORDERS },
  { family: 'clients', basePath: PHARMACY_ROUTES.CLIENTS },
  { family: 'products', basePath: PHARMACY_ROUTES.PRODUCTS },
  { family: 'all-products', basePath: PHARMACY_ROUTES.ALL_PRODUCTS },
  {
    family: 'product-requests',
    basePath: PHARMACY_ROUTES.PRODUCT_REQUESTS,
  },
] as const;

//===================================================================

function normalizePathname(pathname: string): string {
  const [withoutQuery = pathname] = pathname.split('?');
  const [withoutHash = withoutQuery] = withoutQuery.split('#');

  if (withoutHash.length > 1 && withoutHash.endsWith('/')) {
    return withoutHash.slice(0, -1);
  }

  return withoutHash;
}

//===================================================================

function getRouteSegments(
  pathname: string,
  basePath: string
): readonly string[] | null {
  if (pathname === basePath) return [];
  if (!pathname.startsWith(`${basePath}/`)) return null;

  return pathname
    .slice(basePath.length + 1)
    .split('/')
    .filter(Boolean);
}

//===================================================================

export function matchPharmacyRoute(pathname: string): PharmacyRouteMatch {
  const normalizedPathname = normalizePathname(pathname);

  if (
    normalizedPathname === PHARMACY_ROUTES.ROOT ||
    normalizedPathname === PHARMACY_ROUTES.DASHBOARD ||
    /^\/pharmacy\/dashboard\/pharmacy-id-[a-f0-9]{24}$/i.test(
      normalizedPathname
    )
  ) {
    return {
      family: 'dashboard',
      basePath: PHARMACY_ROUTES.DASHBOARD,

      segments:
        getRouteSegments(normalizedPathname, PHARMACY_ROUTES.DASHBOARD) ?? [],
    };
  }

  if (
    normalizedPathname === PHARMACY_ROUTES.PROFILE ||
    normalizedPathname.startsWith(`${PHARMACY_ROUTES.PROFILE}/`)
  ) {
    return {
      family: 'profile',
      basePath: PHARMACY_ROUTES.PROFILE,

      segments:
        getRouteSegments(normalizedPathname, PHARMACY_ROUTES.PROFILE) ?? [],
    };
  }

  for (const route of PHARMACY_ROUTE_FAMILIES) {
    const segments = getRouteSegments(normalizedPathname, route.basePath);

    if (segments !== null) {
      return {
        family: route.family,
        basePath: route.basePath,
        segments,
      };
    }
  }

  return {
    family: 'unknown',
    basePath: null,
    segments: [],
  };
}

//===================================================================

function appendRouteParam(basePath: string, value: EntityId): string {
  const routeSegment = value.trim();

  if (!isValidObjectId(routeSegment)) {
    throw new TypeError('Route parameter must be a valid entity ID.');
  }

  return `${basePath}/${encodeURIComponent(routeSegment)}`;
}

//===================================================================

export function getPharmacyNewOrderPath(pharmacyId: EntityId): string {
  if (!isValidObjectId(pharmacyId)) throw new TypeError('Invalid pharmacy ID.');

  return `${PHARMACY_ROUTES.ORDER_NEW}/pharmacy-id-${pharmacyId.toLowerCase()}`;
}

//===================================================================

export function getPharmacyOrderPath(orderId: EntityId): string {
  if (!isValidObjectId(orderId.trim())) {
    throw new TypeError('Route parameter must be a valid entity ID.');
  }

  return `${PHARMACY_ROUTES.ORDERS}/details/order-id-${orderId.trim().toLowerCase()}`;
}

//===================================================================

export type PharmacyOrderTab =
  | 'products'
  | 'delivery'
  | 'payment'
  | 'comment'
  | 'history';

//===================================================================

export const PHARMACY_ORDER_TAB_SEGMENTS: Readonly<
  Record<PharmacyOrderTab, string>
> = {
  products: '',
  delivery: 'delivery-method',
  payment: 'payment-method',
  comment: 'comments',
  history: 'history',
};

//===================================================================

export function getPharmacyOrderTabPath(
  orderId: EntityId,
  tab: PharmacyOrderTab
): string {
  const base = getPharmacyOrderPath(orderId);
  const segment = PHARMACY_ORDER_TAB_SEGMENTS[tab];

  return segment ? `${base}/${segment}` : base;
}

//===================================================================

export function getPharmacyOrderTabFromPath(
  pathname: string
): PharmacyOrderTab {
  const segment = pathname.split('/').filter(Boolean).at(-1);

  const tab = (
    Object.entries(PHARMACY_ORDER_TAB_SEGMENTS) as Array<
      [PharmacyOrderTab, string]
    >
  ).find(([, value]) => value && segment === value);

  return tab?.[0] ?? 'products';
}

//===================================================================

export function getPharmacyClientPath(clientId: EntityId): string {
  return appendRouteParam(PHARMACY_ROUTES.CLIENTS, clientId);
}

//===================================================================

export function getPharmacyProductPath(productId: EntityId): string {
  return appendRouteParam(PHARMACY_ROUTES.PRODUCTS, productId);
}

//===================================================================

export function getPharmacyAllProductPath(productId: EntityId): string {
  return appendRouteParam(PHARMACY_ROUTES.ALL_PRODUCTS, productId);
}

//===================================================================

export function getPharmacyRequestPath(requestId: EntityId): string {
  return appendRouteParam(PHARMACY_ROUTES.PRODUCT_REQUESTS, requestId);
}

//===================================================================

export function getOwnedPharmacyPath(pharmacyId: EntityId): string {
  return appendRouteParam(PHARMACY_ROUTES.PHARMACIES, pharmacyId);
}
