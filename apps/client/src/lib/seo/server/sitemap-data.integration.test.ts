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
              publicSlugId: 'apteka-kyiv-ph507f1f77bcf86cd799439011',
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

  const home = report.routes.find(
    (route) => route.url === 'https://example.com/'
  );
  assert.ok(home);
  assert.equal(home.lastModified, undefined);
});

//===================================================================

test('reuses the public transport retry policy and preserves sitemap cache options', async () => {
  let productAttempts = 0;
  const requestOptions: Array<
    RequestInit & { next?: { revalidate?: number } }
  > = [];

  const report = await buildClientSitemap({
    siteUrl: 'https://example.com',
    resolveBackendUrl: (path) => `https://api.example.com${path}`,
    logger: { error: () => undefined, warn: () => undefined },
    fetcher: async (url, init) => {
      requestOptions.push(
        (init ?? {}) as RequestInit & { next?: { revalidate?: number } }
      );

      if (String(url).includes('/products')) {
        productAttempts += 1;
        if (productAttempts === 1) return response({}, 503);
      }

      return response({
        status: 'success',
        data: { items: [], totalPages: 1 },
      });
    },
  });

  assert.equal(report.failures.length, 0);
  assert.equal(productAttempts, 2);
  assert.ok(requestOptions.length >= 3);

  for (const options of requestOptions) {
    assert.equal(options.redirect, 'manual');
    assert.equal(options.next?.revalidate, 3600);
    assert.ok(options.signal instanceof AbortSignal);
  }
});
