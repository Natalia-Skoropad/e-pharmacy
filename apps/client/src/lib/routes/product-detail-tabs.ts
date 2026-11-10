import { buildProductContextQueryString } from './route-builders';
import { ROUTES } from './routes';

//===================================================================

export type ProductTab =
  | 'details'
  | 'pharmacies'
  | 'characteristics'
  | 'reviews';

//===================================================================

export const PRODUCT_TAB_LABELS: Readonly<Record<ProductTab, string>> = {
  details: 'Details',
  pharmacies: 'Pharmacies',
  characteristics: 'Characteristics',
  reviews: 'Reviews',
};

//===================================================================

const PRODUCT_TAB_SEGMENTS: Readonly<
  Record<Exclude<ProductTab, 'details'>, string>
> = {
  pharmacies: 'pharmacies',
  characteristics: 'characteristics',
  reviews: 'reviews',
};

//===================================================================

export function getProductTabFromSegment(segment: string): ProductTab | null {
  if (
    segment === 'pharmacies' ||
    segment === 'characteristics' ||
    segment === 'reviews'
  ) {
    return segment;
  }

  return null;
}

//===================================================================

export function buildProductDetailTabPath(
  basePath: string,
  tab: ProductTab,
  contextPharmacyId?: string
): string {
  const cleanBasePath = basePath.replace(/\/$/, '');
  const segment = tab === 'details' ? '' : `/${PRODUCT_TAB_SEGMENTS[tab]}`;

  return `${cleanBasePath}${segment}${buildProductContextQueryString(contextPharmacyId)}`;
}

//===================================================================

export function getProductDetailsBreadcrumbs(
  productName: string,
  productHref: string,
  activeTab: ProductTab
) {
  return [
    { label: 'Home', href: ROUTES.HOME },
    { label: 'Product catalog', href: ROUTES.PRODUCTS_CATALOG },
    {
      label: productName,
      ...(activeTab === 'details' ? {} : { href: productHref }),
    },

    ...(activeTab === 'details'
      ? []
      : [{ label: PRODUCT_TAB_LABELS[activeTab] }]),
  ];
}
