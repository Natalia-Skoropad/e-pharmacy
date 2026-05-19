import type { MetadataRoute } from 'next';

import { CLIENT_ENV } from '@/lib/constants/env';
import { SITEMAP_STATIC_ROUTES } from '@/lib/constants/seo';
import { createAbsoluteUrl } from '@/lib/seo';
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
};

type SitemapStore = {
  id: string;
  name: string;
  isActive?: boolean;
};

type SitemapEntry = {
  path: string;
  priority: number;
};

//===================================================================

const PRODUCT_SITEMAP_PER_PAGE = 200;
const STORE_SITEMAP_PER_PAGE = 100;

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
      cache: 'no-store',
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

  const firstItems = firstPage?.data?.items ?? [];
  const totalPages = firstPage?.data?.totalPages ?? 1;

  if (totalPages <= 1) return firstItems;

  const restPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchSitemapPage<TItem>(
        `${resourcePath}?page=${index + 2}&perPage=${perPage}`
      )
    )
  );

  return restPages.reduce<TItem[]>(
    (items, page) => items.concat(page?.data?.items ?? []),
    firstItems
  );
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
    }));

  const storeEntries = stores
    .filter((store) => store.id && store.name && store.isActive !== false)
    .map((store) => ({
      path: buildStorePath(store.name, store.id),
      priority: 0.7,
    }));

  return [...productEntries, ...storeEntries];
}

//===================================================================

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = SITEMAP_STATIC_ROUTES.map((route) => ({
    path: route,
    priority: route === '/' ? 1 : 0.8,
  }));

  const dynamicEntries = await getDynamicSitemapEntries();
  const entriesByPath = new Map<string, SitemapEntry>();

  [...staticEntries, ...dynamicEntries].forEach((entry) => {
    entriesByPath.set(entry.path, entry);
  });

  return Array.from(entriesByPath.values()).map((entry) => ({
    url: createAbsoluteUrl(entry.path),
    lastModified: now,
    changeFrequency: entry.path === '/' ? 'weekly' : 'daily',
    priority: entry.priority,
  }));
}
