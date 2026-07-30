import 'server-only';

const ISO_CALENDAR_OR_DATETIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/;

//===================================================================

export type SitemapChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

//===================================================================

export type SitemapEntryConfig = Readonly<{
  path: string;
  priority: number;
  changeFrequency: SitemapChangeFrequency;
  lastModified?: Date;
}>;

export type SitemapRouteConfig = SitemapEntryConfig &
  Readonly<{
    url: string;
    lastModified: Date;
  }>;

//===================================================================

function normalizeOrigin(siteUrl: string): string {
  const url = new URL(siteUrl);

  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== '/' && url.pathname !== '')
  ) {
    throw new TypeError('Sitemap site URL must be an HTTP(S) origin-only URL.');
  }

  return url.origin;
}

//===================================================================

export function createAbsoluteUrl(path: string, siteUrl: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new TypeError('Sitemap paths must be absolute application paths.');
  }

  return new URL(path, `${normalizeOrigin(siteUrl)}/`).toString();
}

//===================================================================

export function parseSitemapDate(value?: string): Date | undefined {
  if (!value || !ISO_CALENDAR_OR_DATETIME_PATTERN.test(value)) return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

//===================================================================

function choosePreferredEntry(
  current: SitemapEntryConfig,
  candidate: SitemapEntryConfig
): SitemapEntryConfig {
  if (candidate.priority !== current.priority) {
    return candidate.priority > current.priority ? candidate : current;
  }

  const currentTime =
    current.lastModified?.getTime() ?? Number.NEGATIVE_INFINITY;

  const candidateTime =
    candidate.lastModified?.getTime() ?? Number.NEGATIVE_INFINITY;

  return candidateTime > currentTime ? candidate : current;
}

//===================================================================

export function dedupeSitemapEntries(
  entries: readonly SitemapEntryConfig[]
): SitemapEntryConfig[] {
  const entriesByPath = new Map<string, SitemapEntryConfig>();

  for (const entry of entries) {
    const current = entriesByPath.get(entry.path);
    entriesByPath.set(
      entry.path,
      current ? choosePreferredEntry(current, entry) : entry
    );
  }

  return [...entriesByPath.values()];
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
  }));
}
