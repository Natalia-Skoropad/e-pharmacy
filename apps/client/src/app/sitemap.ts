import type { MetadataRoute } from 'next';

import { CLIENT_ENV } from '@/lib/constants/env';
import { SITE_URL } from '@/lib/constants/metadata';
import { SITEMAP_STATIC_ROUTES } from '@/lib/constants/seo';
import {
  createSitemapRoutes,
  createStaticSitemapEntries,
  dedupeSitemapEntries,
  parseSitemapDate,
} from '@e-pharmacy/config/seo';
import { buildProductPath, buildStorePath } from '@/lib/routes';

//===================================================================

type SitemapApiResponse<TItem> = {
  data?: {
    items?: TItem[];
    totalPages?: number;
  };
};

type SitemapProduct = {
  id: string;
  name: string;
  inStock?: boolean;
  updatedAt?: string;
};

type SitemapStore = {
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
const STORE_SITEMAP_PER_PAGE = 100;
const SITEMAP_REVALIDATE_SECONDS = 3600;
const SITEMAP_FETCH_SAFETY_MAX_PAGES = 500;
const SITEMAP_FETCH_BATCH_SIZE = 20;

//===================================================================

function createApiUrl(path: string): string {
  return new URL(path, CLIENT_ENV.apiBaseUrl).toString();
}

//===================================================================

async function fetchSitemapPage<TItem>(
  path: string
): Promise<SitemapApiResponse<TItem> | null> {
  try {
    const response = await fetch(createApiUrl(path), {
      next: { revalidate: SITEMAP_REVALIDATE_SECONDS },
    });

    if (!response.ok) return null;

    return (await response.json()) as SitemapApiResponse<TItem>;
  } catch {
    return null;
  }
}

//===================================================================

async function fetchAllSitemapItems<TItem>(
  resourcePath: string,
  perPage: number
): Promise<TItem[]> {
  const firstPage = await fetchSitemapPage<TItem>(
    `${resourcePath}?page=1&perPage=${perPage}`
  );

  const allItems = [...(firstPage?.data?.items ?? [])];
  const totalPages = Math.min(
    firstPage?.data?.totalPages ?? 1,
    SITEMAP_FETCH_SAFETY_MAX_PAGES
  );

  if (totalPages <= 1) return allItems;

  for (let pageStart = 2; pageStart <= totalPages; pageStart += SITEMAP_FETCH_BATCH_SIZE) {
    const pageEnd = Math.min(pageStart + SITEMAP_FETCH_BATCH_SIZE - 1, totalPages);
    const pages = await Promise.all(
      Array.from({ length: pageEnd - pageStart + 1 }, (_, index) =>
        fetchSitemapPage<TItem>(
          `${resourcePath}?page=${pageStart + index}&perPage=${perPage}`
        )
      )
    );

    pages.forEach((page) => {
      allItems.push(...(page?.data?.items ?? []));
    });
  }

  return allItems;
}

//===================================================================

async function getDynamicSitemapEntries(): Promise<SitemapEntry[]> {
  const [products, stores] = await Promise.all([
    fetchAllSitemapItems<SitemapProduct>(
      '/products',
      PRODUCT_SITEMAP_PER_PAGE
    ),
    fetchAllSitemapItems<SitemapStore>('/stores', STORE_SITEMAP_PER_PAGE),
  ]);

  const productEntries = products
    .filter((product) => product.id && product.name && product.inStock !== false)
    .map((product) => ({
      path: buildProductPath(product.name, product.id),
      priority: 0.7,
      lastModified: parseSitemapDate(product.updatedAt),
    }));

  const storeEntries = stores
    .filter((store) => store.id && store.name && store.isActive !== false)
    .map((store) => ({
      path: buildStorePath(store.name, store.id),
      priority: 0.7,
      lastModified: parseSitemapDate(store.updatedAt),
    }));

  return [...productEntries, ...storeEntries];
}

//===================================================================

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fallbackLastModified = new Date();
  const staticEntries = createStaticSitemapEntries(
    SITEMAP_STATIC_ROUTES,
    fallbackLastModified
  );
  const dynamicEntries = await getDynamicSitemapEntries();
  const entries = dedupeSitemapEntries([...staticEntries, ...dynamicEntries]);

  return createSitemapRoutes(
    entries,
    SITE_URL,
    fallbackLastModified
  ) as MetadataRoute.Sitemap;
}
