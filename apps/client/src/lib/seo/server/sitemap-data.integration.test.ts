import assert from 'node:assert/strict';
import test from 'node:test';

import { buildClientSitemap } from './sitemap-data';

//===================================================================

function response(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

//===================================================================

test('keeps static routes and reports partial dynamic sitemap failure', async () => {
  const errors: unknown[] = [];
  const report = await buildClientSitemap({
    siteUrl: 'https://example.com',
    resolveBackendUrl: (path) => `https://api.example.com${path}`,
    approvedInfoPaths: ['/delivery-and-payment'],

    logger: {
      error: (...args) => errors.push(args),
      warn: () => undefined,
    },

    fetcher: async (url) => {
      const value = String(url);
      if (value.includes('/products')) return response({}, 503);

      return response({
        status: 'success',

        data: {
          items: [
            {
              id: '507f1f77bcf86cd799439011',
              name: 'Аптека Київ',
              publicSlugId:
                'apteka-kyiv-ph507f1f77bcf86cd799439011',
              isActive: true,
              updatedAt: '2026-07-30T12:00:00Z',
            },
          ],

          totalPages: 1,
        },
      });
    },
  });

  assert.ok(
    report.routes.some((route) => route.url === 'https://example.com/')
  );

  assert.ok(
    report.routes.some(
      (route) =>
        route.url ===
        'https://example.com/apteka-kyiv-ph507f1f77bcf86cd799439011'
    )
  );

  assert.ok(
    report.routes.some(
      (route) => route.url === 'https://example.com/delivery-and-payment'
    )
  );

  assert.equal(
    report.routes.some(
      (route) => route.url === 'https://example.com/return-policy'
    ),
    false
  );

  assert.equal(report.failures.length, 1);
  assert.equal(errors.length, 1);
});

//===================================================================

test('keeps active products in the sitemap when temporary inventory is out of stock', async () => {
  const report = await buildClientSitemap({
    siteUrl: 'https://example.com',
    resolveBackendUrl: (path) => `https://api.example.com${path}`,
    logger: { error: () => undefined, warn: () => undefined },
    fetcher: async (url) => {
      const value = String(url);

      if (value.includes('/products')) {
        return response({
          status: 'success',
          data: {
            items: [
              {
                id: '507f1f77bcf86cd799439011',
                name: 'Temporarily unavailable product',
                publicSlugId:
                  'temporarily-unavailable-product-pr507f1f77bcf86cd799439011',
                inStock: false,
                updatedAt: '2026-07-30T12:00:00Z',
              },
            ],
            totalPages: 1,
          },
        });
      }

      return response({
        status: 'success',
        data: { items: [], totalPages: 1 },
      });
    },
  });

  assert.ok(
    report.routes.some(
      (route) =>
        route.url ===
        'https://example.com/temporarily-unavailable-product-pr507f1f77bcf86cd799439011'
    )
  );
});

//===================================================================

test('does not invent lastModified for static routes', async () => {
  const report = await buildClientSitemap({
    siteUrl: 'https://example.com',
    resolveBackendUrl: (path) => `https://api.example.com${path}`,
    logger: { error: () => undefined, warn: () => undefined },
    fetcher: async () =>
      response({
        status: 'success',
        data: { items: [], totalPages: 1 },
      }),
  });

  const home = report.routes.find((route) => route.url === 'https://example.com/');
  assert.ok(home);
  assert.equal(home.lastModified, undefined);
});

