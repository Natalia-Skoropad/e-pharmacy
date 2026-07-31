import 'server-only';

export * from '../metadata-copy';
export { createPageMetadata } from './create-page-metadata';
export { createClientRobotsConfig } from './robots';
export { ROBOTS_DISALLOW_ROUTES, STATIC_SITEMAP_ENTRIES } from './route-policy';

export {
  createAbsoluteUrl,
  createSitemapRoutes,
  dedupeSitemapEntries,
  parseSitemapDate,
  type SitemapChangeFrequency,
  type SitemapEntryConfig,
  type SitemapRouteConfig,
} from './sitemap';

export {
  buildClientSitemap,
  parseSitemapPageData,
  parseSitemapPharmacy,
  parseSitemapProduct,
  type SitemapFetchFailure,
  type SitemapLoadReport,
} from './sitemap-data';

export { createClientAbsoluteUrl } from './url';
