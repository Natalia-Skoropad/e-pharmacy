import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

test('tablet and desktop top bar keep the current breadcrumb rendered', async () => {
  const css = await readFile(
    new URL('./CabinetTopBar.module.css', import.meta.url),
    'utf8'
  );

  const breadcrumbTrail = await readFile(
    new URL('../../navigation/internal/BreadcrumbTrail.tsx', import.meta.url),
    'utf8'
  );

  // Long names are constrained on tablet/desktop, not hidden. The former
  // blanket selector ban mistook max-width for a visibility regression.
  assert.match(
    css,
    /@media\s*\(min-width:\s*768px\)\s*\{\s*\.pathItem:not\(:first-child\)/
  );

  const nonFirstItemRules = [
    ...css.matchAll(/\.pathItem:not\(:first-child\)\s*\{([^}]*)\}/g),
  ];

  assert.ok(nonFirstItemRules.length > 0);

  for (const [, declarations] of nonFirstItemRules) {
    assert.match(declarations, /max-width:\s*[^;]+;/);
    assert.doesNotMatch(
      declarations,
      /(?:display:\s*none|visibility:\s*hidden|opacity:\s*0(?:;|\s))/
    );
  }

  assert.match(css, /\.pathItem:last-child\s*\{\s*flex:\s*0\s+1\s+auto/);
  assert.match(css, /text-overflow:\s*ellipsis/);
  assert.match(breadcrumbTrail, /aria-current="page"/);
});
