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

  assert.equal(css.includes('.pathItem:not(:first-child)'), false);
  assert.match(css, /text-overflow:\s*ellipsis/);
  assert.match(breadcrumbTrail, /aria-current="page"/);
});
