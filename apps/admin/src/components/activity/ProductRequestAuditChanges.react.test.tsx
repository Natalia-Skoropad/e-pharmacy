import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import type { AdminAuditDetails } from '@/lib/audit/admin-audit';
import { ProductRequestAuditChanges } from './ProductRequestAuditChanges';
import { RenderAuditValue } from './AuditChangeValue';

//===================================================================

const markdown = [
  '## Product description',
  '',
  '- first item',
  '- second item',
  '',
  '1. First instruction',
  '2. Second instruction',
  '',
  '**Important** and *additional information*.',
  '[Product information](https://example.com/product)',
].join('\n');

//===================================================================

function details(
  field: 'fullDescription' | 'pharmacyComment'
): AdminAuditDetails {
  return {
    id: 'audit',
    actorUserId: 'owner',
    actorNameSnapshot: 'Owner',
    action: 'productRequest.updated',
    section: 'productRequests',
    entityType: 'productRequest',
    entityId: 'request',
    entityLabelSnapshot: 'Test product',
    requestId: 'trace',
    createdAt: '2026-11-25T12:00:00Z',
    changedFields: [field],
    before: { [field]: markdown },

    after: {
      [field]: [markdown.slice(0, 25), markdown.slice(25) + '\nUpdated.'],
    },
  };
}

//===================================================================

for (const field of ['fullDescription', 'pharmacyComment'] as const) {
  test(`${field} renders both audit values as Markdown with independent expand controls`, () => {
    const html = renderToStaticMarkup(
      <ProductRequestAuditChanges details={details(field)} />
    );

    assert.equal(
      [...html.matchAll(/<h2>Product description<\/h2>/g)].length,
      2
    );

    assert.equal([...html.matchAll(/<ul>/g)].length, 2);
    assert.equal([...html.matchAll(/<ol>/g)].length, 2);
    assert.equal([...html.matchAll(/<strong>Important<\/strong>/g)].length, 2);

    assert.equal(
      [...html.matchAll(/<em>additional information<\/em>/g)].length,
      2
    );

    assert.equal(
      [...html.matchAll(/href="https:\/\/example\.com\/product"/g)].length,
      2
    );

    assert.equal([...html.matchAll(/Show more/g)].length, 2);
    assert.equal([...html.matchAll(/aria-expanded="false"/g)].length, 2);
    assert.doesNotMatch(html, /## Product description|\*\*Important\*\*/);
  });
}

//===================================================================

test('pharmacy and product request rich audit fields use the same markup and styles', () => {
  const pharmacy = renderToStaticMarkup(
    <RenderAuditValue field="description" value={markdown} />
  );

  const request = renderToStaticMarkup(
    <RenderAuditValue field="fullDescription" value={markdown} />
  );

  const note = renderToStaticMarkup(
    <RenderAuditValue field="pharmacyComment" value={markdown} />
  );

  assert.equal(request, pharmacy);
  assert.equal(note, pharmacy);
});
