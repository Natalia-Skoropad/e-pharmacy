import type { MetadataRoute } from 'next';

import { CLIENT_ENV } from '@/lib/constants/env';
import { createTrustedBackendApiUrl } from '@e-pharmacy/next-api/server';

import {
  appendQueryParams,
  parseJsonResponse,
} from '@e-pharmacy/api-client/transport';

import { parseApiResponseData } from '@e-pharmacy/api-client/response';
import { SITEMAP_INDEXABLE_ROUTES } from '@/lib/seo';

import {
  createSitemapRoutes,
  createStaticSitemapEntries,
  dedupeSitemapEntries,
  parseSitemapDate,
} from '@/lib/seo';

import { buildProductPath, buildPharmacyPath } from '@/lib/routes';

//===================================================================

type SitemapPage<TItem> = Readonly<{
  items: readonly TItem[];
  totalPages: number;
}>;

type SitemapProduct = {
  id: string;
  name: string;
  inStock?: boolean;
  updatedAt?: string;
};

type SitemapPharmacy = {
  id: string;
  name: string;
  isActive?: boolean;
  updatedAt?: string;
};

type SitemapEntry = {
  path: string;
  priority: number;
  lastModified?: Date;
};

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

function parseSitemapProduct(value: unknown): SitemapProduct {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string'
  ) {
    throw new TypeError('Sitemap item must contain string id and name fields.');
  }

  if (value.updatedAt !== undefined && typeof value.updatedAt !== 'string') {
    throw new TypeError(
      'Sitemap item updatedAt must be a string when present.'
    );
  }

  if (value.inStock !== undefined && typeof value.inStock !== 'boolean') {
    throw new TypeError(
      'Product sitemap item inStock must be boolean when present.'
    );
  }

  return {
    id: value.id,
    name: value.name,
    ...(typeof value.updatedAt === 'string'
      ? { updatedAt: value.updatedAt }
      : {}),
    ...(typeof value.inStock === 'boolean' ? { inStock: value.inStock } : {}),
  };
}

//===================================================================

function parseSitemapPharmacy(value: unknown): SitemapPharmacy {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string'
  ) {
    throw new TypeError('Sitemap item must contain string id and name fields.');
  }

  if (value.updatedAt !== undefined && typeof value.updatedAt !== 'string') {
    throw new TypeError(
      'Sitemap item updatedAt must be a string when present.'
    );
  }

  if (value.isActive !== undefined && typeof value.isActive !== 'boolean') {
    throw new TypeError(
      'Pharmacy sitemap item isActive must be boolean when present.'
    );
  }

  return {
    id: value.id,
    name: value.name,
    ...(typeof value.updatedAt === 'string'
      ? { updatedAt: value.updatedAt }
      : {}),
    ...(typeof value.isActive === 'boolean'
      ? { isActive: value.isActive }
      : {}),
  };
}

//===================================================================

function parseSitemapPageData<TItem>(
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

async function fetchSitemapPage<TItem>(
  path: string,
  parseItem: (item: unknown) => TItem
): Promise<SitemapPage<TItem> | null> {
  try {
    const url = createTrustedBackendApiUrl(path);
    const response = await fetch(url, {
      next: { revalidate: SITEMAP_REVALIDATE_SECONDS },
      redirect: 'manual',
    });

    if (!response.ok) return null;

    const json = await parseJsonResponse(response);
    if (!json.success) return null;

    return parseApiResponseData(
      json.value,
      (value) => parseSitemapPageData(value, parseItem),
      {
        url,
        method: 'GET',
      }
    );
  } catch {
    return null;
  }
}

//===================================================================

async function fetchAllSitemapItems<TItem>(
  resourcePath: string,
  perPage: number,
  parseItem: (item: unknown) => TItem
): Promise<TItem[]> {
  const firstPage = await fetchSitemapPage(
    appendQueryParams(resourcePath, { page: 1, perPage }),
    parseItem
  );

  const allItems = [...(firstPage?.items ?? [])];
  const totalPages = Math.min(
    firstPage?.totalPages ?? 1,
    SITEMAP_FETCH_SAFETY_MAX_PAGES
  );

  if (totalPages <= 1) return allItems;

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
        fetchSitemapPage(
          appendQueryParams(resourcePath, {
            page: pageStart + index,
            perPage,
          }),
          parseItem
        )
      )
    );

    pages.forEach((page) => {
      allItems.push(...(page?.items ?? []));
    });
  }

  return allItems;
}

//===================================================================

async function getDynamicSitemapEntries(): Promise<SitemapEntry[]> {
  const [products, pharmacies] = await Promise.all([
    fetchAllSitemapItems(
      '/products',
      PRODUCT_SITEMAP_PER_PAGE,
      parseSitemapProduct
    ),
    fetchAllSitemapItems<SitemapPharmacy>(
      '/pharmacies',
      PHARMACY_SITEMAP_PER_PAGE,
      parseSitemapPharmacy
    ),
  ]);

  const productEntries = products
    .filter(
      (product) => product.id && product.name && product.inStock !== false
    )
    .map((product) => ({
      path: buildProductPath(product.name, product.id),
      priority: 0.7,
      lastModified: parseSitemapDate(product.updatedAt),
    }));

  const pharmacyEntries = pharmacies
    .filter(
      (pharmacy) => pharmacy.id && pharmacy.name && pharmacy.isActive !== false
    )
    .map((pharmacy) => ({
      path: buildPharmacyPath(pharmacy.name, pharmacy.id),
      priority: 0.7,
      lastModified: parseSitemapDate(pharmacy.updatedAt),
    }));

  return [...productEntries, ...pharmacyEntries];
}

//===================================================================

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fallbackLastModified = new Date();
  const staticEntries = createStaticSitemapEntries(
    SITEMAP_INDEXABLE_ROUTES,
    fallbackLastModified
  );
  const dynamicEntries = await getDynamicSitemapEntries();
  const entries = dedupeSitemapEntries([...staticEntries, ...dynamicEntries]);

  return createSitemapRoutes(
    entries,
    CLIENT_ENV.siteUrl,
    fallbackLastModified
  ) as MetadataRoute.Sitemap;
}
