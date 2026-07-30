import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createAbsoluteUrl,
  dedupeSitemapEntries,
  parseSitemapDate,
} from './sitemap';

//===================================================================

test('requires an origin-only site URL and application path', () => {
  assert.equal(
    createAbsoluteUrl('/product-catalog', 'https://example.com'),
    'https://example.com/product-catalog'
  );

  assert.throws(() =>
    createAbsoluteUrl('/product-catalog', 'https://example.com/client-app')
  );

  assert.throws(() =>
    createAbsoluteUrl('https://evil.example', 'https://example.com')
  );
});

//===================================================================

test('accepts only canonical calendar or timezone-aware ISO dates', () => {
  assert.ok(parseSitemapDate('2026-07-30'));
  assert.ok(parseSitemapDate('2026-07-30T12:00:00Z'));
  assert.equal(parseSitemapDate('07/30/2026'), undefined);
  assert.equal(parseSitemapDate('2026-07-30T12:00:00'), undefined);
});

//===================================================================

test('dedupe keeps the highest-priority and then latest entry', () => {
  const older = new Date('2026-01-01T00:00:00Z');
  const newer = new Date('2026-02-01T00:00:00Z');

  const entries = dedupeSitemapEntries([
    {
      path: '/same',
      priority: 0.5,
      changeFrequency: 'daily',
      lastModified: newer,
    },
    {
      path: '/same',
      priority: 0.8,
      changeFrequency: 'weekly',
      lastModified: older,
    },
    {
      path: '/latest',
      priority: 0.7,
      changeFrequency: 'daily',
      lastModified: older,
    },
    {
      path: '/latest',
      priority: 0.7,
      changeFrequency: 'daily',
      lastModified: newer,
    },
  ]);

  assert.equal(entries.find((entry) => entry.path === '/same')?.priority, 0.8);

  assert.equal(
    entries
      .find((entry) => entry.path === '/latest')
      ?.lastModified?.toISOString(),
    newer.toISOString()
  );
});
