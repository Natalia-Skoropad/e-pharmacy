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
    now: new Date('2026-07-30T00:00:00Z'),
    resolveBackendUrl: (path) => `https://api.example.com${path}`,

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
        route.url.includes('apteka-kyiv') ||
        route.url.includes('507f1f77bcf86cd799439011')
    )
  );

  assert.equal(report.failures.length, 1);
  assert.equal(errors.length, 1);
});
