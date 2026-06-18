type SitemapEntryConfig = {
  path: string;
  priority: number;
  lastModified?: Date;
};

type SitemapRouteConfig = SitemapEntryConfig & {
  url: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastModified: Date;
};

//===================================================================

export function createAbsoluteUrl(path: string, siteUrl: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return new URL(normalizedPath, siteUrl).toString();
}

//===================================================================

export function parseSitemapDate(value?: string): Date | undefined {
  if (!value) return undefined;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

//===================================================================

export function createStaticSitemapEntries(
  routes: readonly string[],
  fallbackLastModified: Date
): SitemapEntryConfig[] {
  return routes.map((route) => ({
    path: route,
    priority: route === '/' ? 1 : 0.8,
    lastModified: fallbackLastModified,
  }));
}

//===================================================================

export function dedupeSitemapEntries(
  entries: readonly SitemapEntryConfig[]
): SitemapEntryConfig[] {
  const entriesByPath = new Map<string, SitemapEntryConfig>();

  entries.forEach((entry) => {
    entriesByPath.set(entry.path, entry);
  });

  return Array.from(entriesByPath.values());
}

//===================================================================

export function createSitemapRoutes(
  entries: readonly SitemapEntryConfig[],
  siteUrl: string,
  fallbackLastModified: Date
): SitemapRouteConfig[] {
  return entries.map((entry) => ({
    ...entry,
    url: createAbsoluteUrl(entry.path, siteUrl),
    lastModified: entry.lastModified ?? fallbackLastModified,
    changeFrequency: entry.path === '/' ? 'weekly' : 'daily',
  }));
}
