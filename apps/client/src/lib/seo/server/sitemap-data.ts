import 'server-only';

import { parseApiResponseData } from '@e-pharmacy/api-client/response';
import { apiRoutes } from '@e-pharmacy/api-client/contracts';

import {
  appendQueryParams,
  isApiError,
  parseJsonResponse,
} from '@e-pharmacy/api-client/transport';

import { createTrustedBackendApiUrl } from '@e-pharmacy/next-api/server';

import { buildPharmacyPath, buildProductPath } from '@/lib/routes';

import { STATIC_SITEMAP_ENTRIES } from './route-policy';

import {
  createSitemapRoutes,
  dedupeSitemapEntries,
  parseSitemapDate,
  type SitemapEntryConfig,
  type SitemapRouteConfig,
} from './sitemap';

//===================================================================

type SitemapPage<TItem> = Readonly<{
  items: readonly TItem[];
  totalPages: number;
}>;

type SitemapProduct = Readonly<{
  id: string;
  name: string;
  publicSlugId: string;
  inStock?: boolean;
  updatedAt?: string;
}>;

type SitemapPharmacy = Readonly<{
  id: string;
  name: string;
  publicSlugId: string;
  isActive?: boolean;
  updatedAt?: string;
}>;

export type SitemapFetchFailure = Readonly<{
  resourcePath: string;
  page: number;
  reason: 'http_error' | 'invalid_json' | 'invalid_response' | 'request_error';
  httpStatus?: number;
  requestId?: string;
}>;

export type SitemapLoadReport = Readonly<{
  routes: SitemapRouteConfig[];
  failures: readonly SitemapFetchFailure[];
  truncatedResources: readonly string[];
}>;

//===================================================================

const PRODUCT_SITEMAP_PER_PAGE = 200;
const PHARMACY_SITEMAP_PER_PAGE = 100;
const SITEMAP_REVALIDATE_SECONDS = 3600;
const SITEMAP_FETCH_SAFETY_MAX_PAGES = 500;
const SITEMAP_FETCH_BATCH_SIZE = 5;

//===================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

//===================================================================

export function parseSitemapProduct(value: unknown): SitemapProduct {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.publicSlugId !== 'string'
  ) {
    throw new TypeError(
      'Sitemap product must contain string id, name and publicSlugId.'
    );
  }

  if (value.updatedAt !== undefined && typeof value.updatedAt !== 'string') {
    throw new TypeError('Sitemap product updatedAt must be a string.');
  }

  if (value.inStock !== undefined && typeof value.inStock !== 'boolean') {
    throw new TypeError('Sitemap product inStock must be boolean.');
  }

  return {
    id: value.id,
    name: value.name,
    publicSlugId: value.publicSlugId,
    ...(typeof value.updatedAt === 'string'
      ? { updatedAt: value.updatedAt }
      : {}),
    ...(typeof value.inStock === 'boolean' ? { inStock: value.inStock } : {}),
  };
}

//===================================================================

export function parseSitemapPharmacy(value: unknown): SitemapPharmacy {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.publicSlugId !== 'string'
  ) {
    throw new TypeError(
      'Sitemap pharmacy must contain string id, name and publicSlugId.'
    );
  }

  if (value.updatedAt !== undefined && typeof value.updatedAt !== 'string') {
    throw new TypeError('Sitemap pharmacy updatedAt must be a string.');
  }

  if (value.isActive !== undefined && typeof value.isActive !== 'boolean') {
    throw new TypeError('Sitemap pharmacy isActive must be boolean.');
  }

  return {
    id: value.id,
    name: value.name,
    publicSlugId: value.publicSlugId,

    ...(typeof value.updatedAt === 'string'
      ? { updatedAt: value.updatedAt }
      : {}),

    ...(typeof value.isActive === 'boolean'
      ? { isActive: value.isActive }
      : {}),
  };
}

//===================================================================

export function parseSitemapPageData<TItem>(
  value: unknown,
  parseItem: (item: unknown) => TItem
): SitemapPage<TItem> {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new TypeError('Sitemap response data must contain an items array.');
  }

  if (!Number.isSafeInteger(value.totalPages) || Number(value.totalPages) < 0) {
    throw new TypeError(
      'Sitemap response totalPages must be a non-negative safe integer.'
    );
  }

  return {
    items: value.items.map(parseItem),
    totalPages: Number(value.totalPages),
  };
}

//===================================================================

function getRequestId(error: unknown): string | undefined {
  return isApiError(error) ? error.requestId : undefined;
}

//===================================================================

async function fetchSitemapPage<TItem>({
  resourcePath,
  page,
  perPage,
  parseItem,
  fetcher,
  resolveBackendUrl,
}: Readonly<{
  resourcePath: string;
  page: number;
  perPage: number;
  parseItem: (item: unknown) => TItem;
  fetcher: typeof fetch;
  resolveBackendUrl: (path: string) => string;
}>): Promise<
  | Readonly<{ status: 'success'; page: SitemapPage<TItem> }>
  | Readonly<{ status: 'failure'; failure: SitemapFetchFailure }>
> {
  const path = appendQueryParams(resourcePath, { page, perPage });
  let url: string;

  try {
    url = resolveBackendUrl(path);
  } catch (error) {
    return {
      status: 'failure',
      failure: {
        resourcePath,
        page,
        reason: 'request_error',
        ...(getRequestId(error) ? { requestId: getRequestId(error) } : {}),
      },
    };
  }

  try {
    const response = await fetcher(url, {
      next: { revalidate: SITEMAP_REVALIDATE_SECONDS },
      redirect: 'manual',
    });

    if (!response.ok) {
      return {
        status: 'failure',
        failure: {
          resourcePath,
          page,
          reason: 'http_error',
          httpStatus: response.status,
          ...(response.headers.get('x-request-id')
            ? { requestId: response.headers.get('x-request-id') ?? undefined }
            : {}),
        },
      };
    }

    const json = await parseJsonResponse(response);
    if (!json.success) {
      return {
        status: 'failure',
        failure: { resourcePath, page, reason: 'invalid_json' },
      };
    }

    return {
      status: 'success',
      page: parseApiResponseData(
        json.value,
        (value) => parseSitemapPageData(value, parseItem),
        { url, method: 'GET' }
      ),
    };
  } catch (error) {
    return {
      status: 'failure',
      failure: {
        resourcePath,
        page,
        reason:
          isApiError(error) && error.transportCode === 'INVALID_RESPONSE'
            ? 'invalid_response'
            : 'request_error',

        ...(isApiError(error) && error.httpStatus !== undefined
          ? { httpStatus: error.httpStatus }
          : {}),

        ...(getRequestId(error) ? { requestId: getRequestId(error) } : {}),
      },
    };
  }
}

//===================================================================

async function fetchAllSitemapItems<TItem>({
  resourcePath,
  perPage,
  parseItem,
  fetcher,
  resolveBackendUrl,
}: Readonly<{
  resourcePath: string;
  perPage: number;
  parseItem: (item: unknown) => TItem;
  fetcher: typeof fetch;
  resolveBackendUrl: (path: string) => string;
}>): Promise<
  Readonly<{
    items: readonly TItem[];
    failures: readonly SitemapFetchFailure[];
    truncated: boolean;
  }>
> {
  const firstResult = await fetchSitemapPage({
    resourcePath,
    page: 1,
    perPage,
    parseItem,
    fetcher,
    resolveBackendUrl,
  });

  if (firstResult.status === 'failure') {
    return { items: [], failures: [firstResult.failure], truncated: false };
  }

  const items = [...firstResult.page.items];
  const failures: SitemapFetchFailure[] = [];
  const truncated =
    firstResult.page.totalPages > SITEMAP_FETCH_SAFETY_MAX_PAGES;
  const totalPages = Math.min(
    firstResult.page.totalPages,
    SITEMAP_FETCH_SAFETY_MAX_PAGES
  );

  for (
    let pageStart = 2;
    pageStart <= totalPages;
    pageStart += SITEMAP_FETCH_BATCH_SIZE
  ) {
    const pageEnd = Math.min(
      pageStart + SITEMAP_FETCH_BATCH_SIZE - 1,
      totalPages
    );

    const pages = await Promise.all(
      Array.from({ length: pageEnd - pageStart + 1 }, (_, index) =>
        fetchSitemapPage({
          resourcePath,
          page: pageStart + index,
          perPage,
          parseItem,
          fetcher,
          resolveBackendUrl,
        })
      )
    );

    for (const result of pages) {
      if (result.status === 'success') items.push(...result.page.items);
      else failures.push(result.failure);
    }
  }

  return { items, failures, truncated };
}

//===================================================================

export async function buildClientSitemap({
  siteUrl,
  now = new Date(),
  fetcher = fetch,
  resolveBackendUrl = createTrustedBackendApiUrl,
  logger = console,
}: Readonly<{
  siteUrl: string;
  now?: Date;
  fetcher?: typeof fetch;
  resolveBackendUrl?: (path: string) => string;
  logger?: Pick<Console, 'error' | 'warn'>;
}>): Promise<SitemapLoadReport> {
  const [productsResult, pharmaciesResult] = await Promise.all([
    fetchAllSitemapItems({
      resourcePath: apiRoutes.products.list,
      perPage: PRODUCT_SITEMAP_PER_PAGE,
      parseItem: parseSitemapProduct,
      fetcher,
      resolveBackendUrl,
    }),

    fetchAllSitemapItems({
      resourcePath: apiRoutes.pharmacies.list,
      perPage: PHARMACY_SITEMAP_PER_PAGE,
      parseItem: parseSitemapPharmacy,
      fetcher,
      resolveBackendUrl,
    }),
  ]);

  const dynamicEntries: SitemapEntryConfig[] = [
    ...productsResult.items
      .filter((product) => product.inStock !== false)
      .map((product) => ({
        path: buildProductPath(product.name, product.id, product.publicSlugId),
        priority: 0.7,
        changeFrequency: 'daily' as const,
        lastModified: parseSitemapDate(product.updatedAt),
      })),

    ...pharmaciesResult.items
      .filter((pharmacy) => pharmacy.isActive !== false)
      .map((pharmacy) => ({
        path: buildPharmacyPath(
          pharmacy.name,
          pharmacy.id,
          pharmacy.publicSlugId
        ),
        priority: 0.7,
        changeFrequency: 'daily' as const,
        lastModified: parseSitemapDate(pharmacy.updatedAt),
      })),
  ];

  const failures = [...productsResult.failures, ...pharmaciesResult.failures];
  const truncatedResources = [
    ...(productsResult.truncated ? [apiRoutes.products.list] : []),
    ...(pharmaciesResult.truncated ? [apiRoutes.pharmacies.list] : []),
  ];

  if (failures.length > 0) {
    logger.error('Sitemap was generated with partial backend data.', {
      failures,
    });
  }

  if (truncatedResources.length > 0) {
    logger.warn('Sitemap page safety limit was reached.', {
      resources: truncatedResources,
      maxPages: SITEMAP_FETCH_SAFETY_MAX_PAGES,
    });
  }

  const entries = dedupeSitemapEntries([
    ...STATIC_SITEMAP_ENTRIES.map((entry) => ({ ...entry, lastModified: now })),
    ...dynamicEntries,
  ]);

  return {
    routes: createSitemapRoutes(entries, siteUrl, now),
    failures,
    truncatedResources,
  };
}
