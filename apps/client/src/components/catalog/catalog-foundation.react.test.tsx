import assert from 'node:assert/strict';
import test from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import {
  CatalogCardHeading,
  useCatalogCardTitleId,
  type CatalogCardHeadingLevel,
} from './CatalogEntityCard/CatalogCardSemantics';

import CatalogGrid from './CatalogGrid/CatalogGrid';

//===================================================================

function SemanticCard({ level }: Readonly<{ level: CatalogCardHeadingLevel }>) {
  const titleId = useCatalogCardTitleId();

  return (
    <article aria-labelledby={titleId}>
      <CatalogCardHeading id={titleId} level={level}>
        Example item
      </CatalogCardHeading>
    </article>
  );
}

//===================================================================

test('supports contextual heading levels and unique instance labels', () => {
  const markup = renderToStaticMarkup(
    <>
      <SemanticCard level={2} />
      <SemanticCard level={3} />
    </>
  );

  assert.equal((markup.match(/<h2/g) ?? []).length, 1);
  assert.equal((markup.match(/<h3/g) ?? []).length, 1);

  const labelledBy = [...markup.matchAll(/aria-labelledby="([^"]+)"/g)].map(
    (match) => match[1]
  );

  assert.equal(labelledBy.length, 2);
  assert.notEqual(labelledBy[0], labelledBy[1]);
});

//===================================================================

test('renders catalog collections with list semantics', () => {
  const markup = renderToStaticMarkup(
    <CatalogGrid ariaLabel="Products">
      <CatalogGrid.Item>
        <article>Product</article>
      </CatalogGrid.Item>
    </CatalogGrid>
  );

  assert.match(markup, /^<ul/);
  assert.match(markup, /aria-label="Products"/);
  assert.match(markup, /<li/);
});
