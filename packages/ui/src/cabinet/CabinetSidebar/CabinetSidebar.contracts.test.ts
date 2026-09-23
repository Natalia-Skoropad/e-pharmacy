import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

test('cabinet sidebar supports accessible nested groups in expanded and collapsed modes', async () => {
  const source = await readFile(
    new URL('./CabinetSidebar.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /isNavigationGroup\(item\)/);
  assert.match(source, /isNavigationItemActive\(item, activePath\)/);

  assert.match(
    source,
    /aria-expanded=\{isCollapsed \? collapsedOpen : expanded\}/
  );

  assert.match(source, /aria-controls=/);
  assert.match(source, /collapsedSubmenu/);
  assert.match(source, /useOutsidePointerDown/);
  assert.match(source, /event\.key !== 'Escape'/);
  assert.match(source, /groupButtonRefs\.current\.get\(index\)\?\.focus\(\)/);
});
